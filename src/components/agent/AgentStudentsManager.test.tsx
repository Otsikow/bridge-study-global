import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AgentStudentsManager from "./AgentStudentsManager";
import { tenantStudentsQueryKey } from "@/hooks/useTenantStudents";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    profile: {
      id: "agent-123",
      tenant_id: "tenant-456",
    },
    loading: false,
  }),
}));

vi.mock("@/hooks/useTenantStudents", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/useTenantStudents")>();
  return {
    tenantStudentsQueryKey: actual.tenantStudentsQueryKey,
    useTenantStudents: vi.fn(() => ({
      data: [],
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })),
  };
});

vi.mock("@/components/agent/AgentInviteCodeManager", () => ({
  default: () => <div data-testid="agent-invite-code-manager" />,
}));

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

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children: ReactNode }) => children,
}));

describe("AgentStudentsManager student invite flow", () => {
  const supabaseMock = supabase as unknown as {
    functions: {
      invoke: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    toastSpy.mockReset();
    supabaseMock.functions.invoke.mockReset();
  });

  const renderWithQueryClient = () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const view = render(
      <QueryClientProvider client={queryClient}>
        <AgentStudentsManager />
      </QueryClientProvider>,
    );

    return { view, queryClient, invalidateSpy };
  };

  it("invites a new student successfully", async () => {
    const user = userEvent.setup();
    const { invalidateSpy, queryClient } = renderWithQueryClient();

    supabaseMock.functions.invoke.mockResolvedValue({
      data: { success: true, studentId: "student-1" },
      error: null,
    });

    const [openDialogButton] = screen.getAllByRole("button", { name: /invite student/i });
    await user.click(openDialogButton);

    await user.type(screen.getByLabelText(/full name/i), "  Jane Doe  ");
    await user.type(screen.getByLabelText(/email address/i), "  Jane@example.com  ");
    await user.type(screen.getByLabelText(/phone number/i), " 1234567 ");

    await user.click(screen.getByRole("button", { name: /send invite/i }));

    await waitFor(() => expect(supabaseMock.functions.invoke).toHaveBeenCalledTimes(1));

    expect(supabaseMock.functions.invoke).toHaveBeenCalledWith("invite-student", {
      body: {
        fullName: "Jane Doe",
        email: "jane@example.com",
        phone: "1234567",
        agentProfileId: "agent-123",
        tenantId: "tenant-456",
      },
    });

    const successToast = toastSpy.mock.calls.at(-1)?.[0] as {
      title?: string;
      description?: string;
    };

    expect(successToast).toMatchObject({ title: "Student invited" });
    expect(successToast.description).toMatch(
      /Jane Doe\s+will receive an email with next steps\./,
    );

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: tenantStudentsQueryKey("tenant-456"),
      }),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    queryClient.clear();
    invalidateSpy.mockRestore();
  });

  it("shows an error toast when the invite fails", async () => {
    const user = userEvent.setup();
    const { invalidateSpy, queryClient } = renderWithQueryClient();

    supabaseMock.functions.invoke.mockResolvedValue({
      data: { success: false, error: "Unable to process invite" },
      error: null,
    });

    const [openDialogButton] = screen.getAllByRole("button", { name: /invite student/i });
    await user.click(openDialogButton);

    await user.type(screen.getByLabelText(/full name/i), "Alex Student");
    await user.type(screen.getByLabelText(/email address/i), "alex@student.com");

    await user.click(screen.getByRole("button", { name: /send invite/i }));

    await waitFor(() => expect(supabaseMock.functions.invoke).toHaveBeenCalledTimes(1));

    const failureToast = toastSpy.mock.calls.at(-1)?.[0] as {
      title?: string;
      description?: string;
      variant?: string;
    };

    expect(failureToast).toMatchObject({
      title: "Unable to invite student",
      description: "Unable to process invite",
      variant: "destructive",
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(within(screen.getByRole("dialog")).getByText("Invite a student")).toBeInTheDocument();

    queryClient.clear();
    invalidateSpy.mockRestore();
  });
});
