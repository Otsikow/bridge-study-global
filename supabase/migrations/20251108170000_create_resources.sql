
-- Create the enum type for resource categories
CREATE TYPE resource_category AS ENUM ('Policies', 'Training', 'Forms', 'Reports');

-- Create the resources table
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category resource_category NOT NULL,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tenant_id UUID NOT NULL
);

-- Add foreign key constraint to tenants table
ALTER TABLE resources
ADD CONSTRAINT fk_tenant
FOREIGN KEY (tenant_id)
REFERENCES tenants(id)
ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Allow read access to all users" ON resources
FOR SELECT USING (true);

-- Seed the resources table with sample data
INSERT INTO resources (title, description, category, file_url, tenant_id)
VALUES
    -- Policies
    ('Student Data Protection Policy', 'This policy outlines how student data is collected, used, and protected.', 'Policies', 'https://example.com/student-data-protection-policy.pdf', '00000000-0000-0000-0000-000000000001'),
    ('Equal Opportunities Policy', 'This policy ensures that all individuals are treated fairly and without discrimination.', 'Policies', 'https://example.com/equal-opportunities-policy.pdf', '00000000-0000-0000-0000-000000000001'),
    ('Anti-Fraud & Integrity Policy', 'This policy provides a framework for preventing, detecting, and responding to fraud and misconduct.', 'Policies', 'https://example.com/anti-fraud-integrity-policy.pdf', '00000000-0000-0000-0000-000000000001'),
    ('Staff Confidentiality Policy', 'This policy defines the responsibilities of staff in maintaining the confidentiality of sensitive information.', 'Policies', 'https://example.com/staff-confidentiality-policy.pdf', '00000000-0000-0000-0000-000000000001'),

    -- Training
    ('New Employee Onboarding', 'A comprehensive training program for new hires.', 'Training', 'https://example.com/new-employee-onboarding.pdf', '00000000-0000-0000-0000-000000000001'),
    ('Cybersecurity Awareness', 'Training to educate employees about cybersecurity threats and best practices.', 'Training', 'https://example.com/cybersecurity-awareness.pdf', '00000000-0000-0000-0000-000000000001'),
    ('Data Protection Training', 'A course on data protection regulations and compliance.', 'Training', 'https://example.com/data-protection-training.pdf', '00000000-0000-0000-0000-000000000001'),
    ('Leadership Development Program', 'A program designed to develop leadership skills in employees.', 'Training', 'https://example.com/leadership-development-program.pdf', '00000000-0000-0000-0000-000000000001'),

    -- Forms
    ('Expense Claim Form', 'A form for submitting expense claims.', 'Forms', 'https://example.com/expense-claim-form.pdf', '00000000-0000-0000-0000-000000000001'),
    ('Leave Request Form', 'A form for requesting time off.', 'Forms', 'https://example.com/leave-request-form.pdf', '00000000-0000-0000-0000-000000000001'),
    ('Performance Review Form', 'A form for conducting employee performance reviews.', 'Forms', 'https://example.com/performance-review-form.pdf', '00000000-0000-0000-0000-000000000001'),
    ('IT Support Request Form', 'A form for requesting IT support.', 'Forms', 'https://example.com/it-support-request-form.pdf', '00000000-0000-0000-0000-000000000001'),

    -- Reports
    ('Annual Financial Report 2023', 'A report on the financial performance of the organization in 2023.', 'Reports', 'https://example.com/annual-financial-report-2023.pdf', '00000000-0000-0000-0000-000000000001'),
    ('Q3 2024 Sales Report', 'A report on sales performance in the third quarter of 2024.', 'Reports', 'https://example.com/q3-2024-sales-report.pdf', '00000000-0000-0000-0000-000000000001'),
    ('Employee Satisfaction Survey Results', 'A report on the results of the recent employee satisfaction survey.', 'Reports', 'https://example.com/employee-satisfaction-survey-results.pdf', '00000000-0000-0000-0000-000000000001'),
    ('Website Analytics Report', 'A report on website traffic and user engagement.', 'Reports', 'https://example.com/website-analytics-report.pdf', '00000000-0000-0000-0000-000000000001');
