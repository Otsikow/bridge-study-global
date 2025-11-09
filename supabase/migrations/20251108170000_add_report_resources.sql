ALTER TYPE public.resource_content_type ADD VALUE IF NOT EXISTS 'reports';

INSERT INTO public.resource_library (title, description, file_type, resource_type, storage_path, file_name, file_extension, access_level)
VALUES
  (
    'Monthly Admissions Summary',
    'A comprehensive monthly overview of student admissions metrics, tracking application numbers, acceptance rates, and enrollment figures across various universities.',
    'pdf',
    'reports',
    'reports/monthly_admissions_summary.pdf',
    'monthly_admissions_summary.pdf',
    'pdf',
    'staff'
  ),
  (
    'Agent Performance Report',
    'An Excel report tracking key performance indicators for agents, including student recruitment numbers, application success rates, and commission statements.',
    'spreadsheet',
    'reports',
    'reports/agent_performance_report.xlsx',
    'agent_performance_report.xlsx',
    'xlsx',
    'staff'
  ),
  (
    'Student Visa Approvals Report',
    'A CSV report detailing student visa approval rates by country, university, and course, providing insights into immigration trends.',
    'spreadsheet',
    'reports',
    'reports/student_visa_approvals.csv',
    'student_visa_approvals.csv',
    'csv',
    'staff'
  ),
  (
    'Financial Disbursement Report',
    'A PDF report that outlines financial disbursements to partner universities, detailing tuition fees and other payments processed for enrolled students.',
    'pdf',
    'reports',
    'reports/financial_disbursement_report.pdf',
    'financial_disbursement_report.pdf',
    'pdf',
    'staff'
  );