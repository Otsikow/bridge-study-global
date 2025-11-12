import { useState, type ComponentProps, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import InviteStudentDialog from "./InviteStudentDialog";
import { tenantStudentsQueryKey } from "@/hooks/useTenantStudents";
import { supabase } from "@/integrations/supabase/client";

const toastSpy = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastSpy,
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

const supabaseMock = supabase as unknown as {
  functions: {
    invoke: ReturnType<typeof vi.fn>;
  };
};

describe("InviteStudentDialog", () => {
  beforeEach(() => {
    toastSpy.mockReset();
    supabaseMock.functions.invoke.mockReset();
  });

  const renderDialog = (props?: Partial<ComponentProps<typeof InviteStudentDialog>>) => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const DialogHost = () => {
      const [open, setOpen] = useState(false);
      return (
        <InviteStudentDialog
          tenantId="tenant-123"
          counselorProfileId="staff-456"
          open={open}
          onOpenChange={setOpen}
          {...props}
        />
      );
    };

    const view = render(<DialogHost />, { wrapper: Wrapper });

    return { view, queryClient, invalidateSpy };
  };

  it("invites a student on behalf of staff", async () => {
    const user = userEvent.setup();
    const { invalidateSpy, queryClient } = renderDialog();

    supabaseMock.functions.invoke.mockResolvedValue({
      data: { success: true, studentId: "student-789" },
      error: null,
    });

    await user.click(screen.getByRole("button", { name: /invite student/i }));

    await user.type(screen.getByLabelText(/full name/i), "Taylor Student");
    await user.type(screen.getByLabelText(/email address/i), "taylor@student.com");

    await user.click(screen.getByRole("button", { name: /send invite/i }));

    await waitFor(() => expect(supabaseMock.functions.invoke).toHaveBeenCalledTimes(1));

    expect(supabaseMock.functions.invoke).toHaveBeenCalledWith("invite-student", {
      body: {
        fullName: "Taylor Student",
        email: "taylor@student.com",
        tenantId: "tenant-123",
        counselorProfileId: "staff-456",
      },
    });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: tenantStudentsQueryKey("tenant-123"),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["staff", "students", "tenant-123"],
        exact: false,
      });
    });

    const successToast = toastSpy.mock.calls.at(-1)?.[0];
    expect(successToast).toMatchObject({ title: "Student invited" });

    queryClient.clear();
    invalidateSpy.mockRestore();
  });
});
