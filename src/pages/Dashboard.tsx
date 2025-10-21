import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  FileText, 
  Users, 
  TrendingUp,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  LogOut
} from 'lucide-react';
import gegLogo from '@/assets/geg-logo.png';

const Dashboard = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const getDashboardContent = () => {
    switch (profile?.role) {
      case 'student':
        return <StudentDashboard />;
      case 'agent':
        return <AgentDashboard />;
      case 'partner':
        return <PartnerDashboard />;
      case 'staff':
      case 'admin':
        return <StaffDashboard />;
      default:
        return <DefaultDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={gegLogo} alt="GEG Logo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold">GEG Dashboard</h1>
              <p className="text-xs text-muted-foreground">{profile?.role.toUpperCase()}</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h2 className="text-2xl font-bold">Welcome back, {profile?.full_name}!</h2>
          <p className="text-muted-foreground">
            {profile?.role && profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} Dashboard
          </p>
        </div>
        {getDashboardContent()}
      </div>
    </div>
  );
};

const StudentDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Profile Completeness
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">60%</div>
          <p className="text-xs text-muted-foreground mt-1">
            3 of 5 steps complete
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Active Applications
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground mt-1">
            Start browsing programs
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Documents Uploaded
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">0</div>
          <p className="text-xs text-muted-foreground mt-1">
            Upload key documents
          </p>
        </CardContent>
      </Card>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link to="/student/onboarding">
            <Button className="w-full justify-start" variant="outline">
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Your Profile
            </Button>
          </Link>
          <Link to="/student/profile">
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </Link>
          <Link to="/student/documents">
            <Button className="w-full justify-start" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              My Documents
            </Button>
          </Link>
          <Link to="/student/applications">
            <Button className="w-full justify-start" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              My Applications
            </Button>
          </Link>
          <Link to="/search">
            <Button className="w-full justify-start" variant="outline">
              <GraduationCap className="mr-2 h-4 w-4" />
              Browse Programs
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Complete your profile with personal details, education history, and test scores</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Upload required documents like passport and transcripts</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Browse and apply to programs that match your goals</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

const AgentDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">24</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">37</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Commissions (Pending)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$4,250</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">92%</div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Agent Tools</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-auto py-4 flex-col">
          <Users className="h-6 w-6 mb-2" />
          <span className="text-sm">My Students</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col">
          <FileText className="h-6 w-6 mb-2" />
          <span className="text-sm">Applications</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col">
          <TrendingUp className="h-6 w-6 mb-2" />
          <span className="text-sm">Earnings</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col">
          <GraduationCap className="h-6 w-6 mb-2" />
          <span className="text-sm">Programs</span>
        </Button>
      </CardContent>
    </Card>
  </div>
);

const PartnerDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">New Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">12</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">8</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Offers Issued</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">45</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Enrolled</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">28</div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>University Management</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Button variant="outline" className="h-auto py-4 flex-col">
          <FileText className="h-6 w-6 mb-2" />
          <span className="text-sm">Applications</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col">
          <Building2 className="h-6 w-6 mb-2" />
          <span className="text-sm">Programs</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col">
          <CheckCircle className="h-6 w-6 mb-2" />
          <span className="text-sm">Issue Offers</span>
        </Button>
      </CardContent>
    </Card>
  </div>
);

const StaffDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">342</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Needs Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">28</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">186</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (MTD)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">$24.5K</div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Admin Tools</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/applications">
          <Button variant="outline" className="h-auto py-4 flex-col w-full">
            <FileText className="h-6 w-6 mb-2" />
            <span className="text-sm">Applications</span>
          </Button>
        </Link>
        <Link to="/users">
          <Button variant="outline" className="h-auto py-4 flex-col w-full">
            <Users className="h-6 w-6 mb-2" />
            <span className="text-sm">Users</span>
          </Button>
        </Link>
        <Link to="/universities">
          <Button variant="outline" className="h-auto py-4 flex-col w-full">
            <Building2 className="h-6 w-6 mb-2" />
            <span className="text-sm">Universities</span>
          </Button>
        </Link>
        <Link to="/reports">
          <Button variant="outline" className="h-auto py-4 flex-col w-full">
            <TrendingUp className="h-6 w-6 mb-2" />
            <span className="text-sm">Reports</span>
          </Button>
        </Link>
      </CardContent>
    </Card>
  </div>
);

const DefaultDashboard = () => (
  <Card>
    <CardContent className="pt-6">
      <p className="text-center text-muted-foreground">Loading dashboard...</p>
    </CardContent>
  </Card>
);

export default Dashboard;