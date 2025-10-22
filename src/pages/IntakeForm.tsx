import StudentIntakeForm from '@/components/forms/StudentIntakeForm';

export default function IntakeForm() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Student Intake Form</h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Complete this form to start your international education journey
          </p>
        </div>
        <StudentIntakeForm />
      </div>
    </div>
  );
}