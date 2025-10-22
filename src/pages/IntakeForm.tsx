import StudentIntakeForm from '@/components/forms/StudentIntakeForm';

export default function IntakeForm() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Student Intake Form</h1>
          <p className="text-muted-foreground">
            Complete this form to start your international education journey
          </p>
        </div>
        <StudentIntakeForm />
      </div>
    </div>
  );
}