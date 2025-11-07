import { DashboardLayout } from "@/components/layout/DashboardLayout";
import BlogAdmin from "@/pages/admin/BlogAdmin";

export default function StaffBlog() {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
        <BlogAdmin />
      </div>
    </DashboardLayout>
  );
}
