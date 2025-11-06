import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, ArrowLeft, ArrowRight, Check, UserCircle, Mail, Lock, Phone, Globe, AtSign } from 'lucide-react';
import gegLogo from '@/assets/geg-logo.png';
import { cn } from '@/lib/utils';
import { formatReferralUsername } from '@/lib/referrals';
import BackButton from '@/components/BackButton';

type UserRole = 'student' | 'agent' | 'partner';

const ROLE_OPTIONS: UserRole[] = ['student', 'agent', 'partner'];

const BASE_COUNTRY_OPTIONS = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'New Zealand',
  'India', 'China', 'Japan', 'Germany', 'France', 'Spain', 'Italy',
  'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Singapore', 'Malaysia',
  'UAE', 'Saudi Arabia', 'South Africa', 'Brazil', 'Mexico', 'Argentina',
  'South Korea', 'Pakistan', 'Bangladesh', 'Nigeria', 'Kenya', 'Other'
];

const POPULAR_AFRICAN_COUNTRIES = [
  'Ghana',
  'Egypt',
  'Morocco',
  'Ethiopia',
  'Uganda',
  'Tanzania',
  'Rwanda',
  'Zimbabwe',
  'Zambia',
  'Cameroon',
  "Cote d'Ivoire",
  'Senegal',
  'Algeria',
  'Tunisia',
  'Botswana'
];

const buildCountryOptions = (role: UserRole) => {
  if (role !== 'agent') {
    return BASE_COUNTRY_OPTIONS;
  }

  const baseWithoutOther = BASE_COUNTRY_OPTIONS.filter((country) => country !== 'Other');
  const deduped = Array.from(new Set([...baseWithoutOther, ...POPULAR_AFRICAN_COUNTRIES]));

  return [...deduped, 'Other'];
};

const Signup = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
    const [username, setUsername] = useState('');
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [refParam, setRefParam] = useState<string | null>(null);
    const [referrerInfo, setReferrerInfo] = useState<{ id: string; username: string; full_name?: string } | null>(null);
    const [referrerError, setReferrerError] = useState<string | null>(null);
    const [referrerLoading, setReferrerLoading] = useState(false);
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const totalSteps = 3;

  const countryOptions = useMemo(() => buildCountryOptions(role), [role]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
      const refQuery = params.get('ref');
      if (!roleParam) {
        // still check for referral parameter
        if (refQuery) {
          const normalizedRef = formatReferralUsername(refQuery);
          setRefParam((prev) => (prev === normalizedRef ? prev : normalizedRef));
        } else {
          setRefParam((prev) => (prev !== null ? null : prev));
          setReferrerInfo(null);
          setReferrerError(null);
        }
        return;
    }

    const normalizedRole = roleParam.toLowerCase() as UserRole;
    if (!ROLE_OPTIONS.includes(normalizedRole)) {
        if (refQuery) {
          const normalizedRef = formatReferralUsername(refQuery);
          setRefParam((prev) => (prev === normalizedRef ? prev : normalizedRef));
        } else {
          setRefParam((prev) => (prev !== null ? null : prev));
          setReferrerInfo(null);
          setReferrerError(null);
        }
      return;
    }

    setRole((currentRole) => {
      if (currentRole === normalizedRole) {
        return currentRole;
      }
      setStep(1);
      return normalizedRole;
    });

      if (refQuery) {
        const normalizedRef = formatReferralUsername(refQuery);
        setRefParam((prev) => (prev === normalizedRef ? prev : normalizedRef));
      } else {
        setRefParam((prev) => (prev !== null ? null : prev));
        setReferrerInfo(null);
        setReferrerError(null);
      }
  }, [location.search]);

    useEffect(() => {
      if (!refParam) {
        setReferrerInfo(null);
        setReferrerError(null);
        setReferrerLoading(false);
        return;
      }

      let isActive = true;
      setReferrerLoading(true);
      setReferrerError(null);

      supabase
        .from('profiles')
        .select('id, username, full_name')
        .eq('username', refParam)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!isActive) return;
          if (error || !data) {
            setReferrerInfo(null);
            setReferrerError('We could not find a matching referrer for this link.');
          } else {
            setReferrerInfo({ id: data.id, username: data.username, full_name: data.full_name });
            setReferrerError(null);
          }
        })
        .finally(() => {
          if (isActive) {
            setReferrerLoading(false);
          }
        });

      return () => {
        isActive = false;
      };
    }, [refParam]);

    useEffect(() => {
      if (!username) {
        setUsernameError(null);
        setCheckingUsername(false);
        return;
      }

      if (username.length < 3) {
        setUsernameError('Username must be at least 3 characters.');
        setCheckingUsername(false);
        return;
      }

      setCheckingUsername(true);
      let isCancelled = false;
      const handler = setTimeout(async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .maybeSingle();

        if (isCancelled) {
          return;
        }

        if (error) {
          setUsernameError('Unable to verify username availability. Please try again.');
        } else if (data) {
          setUsernameError('This username is already taken. Try another one.');
        } else {
          setUsernameError(null);
        }
        setCheckingUsername(false);
      }, 500);

      return () => {
        isCancelled = true;
        clearTimeout(handler);
      };
    }, [username]);

  const handleGoogleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const validateStep1 = () => {
    if (!role) {
      toast({
        variant: 'destructive',
        title: 'Role required',
        description: 'Please select your account type.',
      });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!fullName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Name required',
        description: 'Please enter your full name.',
      });
      return false;
    }
    if (!phone.trim()) {
      toast({
        variant: 'destructive',
        title: 'Phone required',
        description: 'Please enter your phone number.',
      });
      return false;
    }
    if (!country) {
      toast({
        variant: 'destructive',
        title: 'Country required',
        description: 'Please select your country.',
      });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
      if (!username.trim()) {
        toast({
          variant: 'destructive',
          title: 'Username required',
          description: 'Please choose a username to continue.',
        });
        return false;
      }
      if (username.length < 3) {
        toast({
          variant: 'destructive',
          title: 'Username too short',
          description: 'Usernames must be at least 3 characters long.',
        });
        return false;
      }
      if (usernameError) {
        toast({
          variant: 'destructive',
          title: 'Username unavailable',
          description: usernameError,
        });
        return false;
      }
    if (!email.trim() || !email.includes('@')) {
      toast({
        variant: 'destructive',
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
      });
      return false;
    }
    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid password',
        description: 'Password must be at least 6 characters long.',
      });
      return false;
    }
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
      return;
    }

    if (step === 2) {
      if (validateStep2()) {
        setStep(3);
      }
      return;
    }

    if (!validateStep3()) {
      return;
    }

    setLoading(true);

    try {
        const { error } = await signUp({
          email,
          password,
          fullName,
          role,
          phone,
          country,
          username,
          referrerId: referrerInfo?.id,
          referrerUsername: referrerInfo?.username,
        });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Signup failed',
          description:
            error instanceof Error
              ? error.message
              : 'An error occurred during signup',
        });
        setLoading(false);
      } else {
        toast({
          title: 'Account created!',
          description:
            'Please check your email to verify your account. You will be redirected to login.',
        });
        setTimeout(() => {
          navigate('/auth/login');
        }, 2000);
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Signup failed',
        description: 'An unexpected error occurred. Please try again.',
      });
      setLoading(false);
    }
  };

  const getRoleIcon = (roleType: UserRole) => {
    switch (roleType) {
      case 'student':
        return '🎓';
      case 'agent':
        return '💼';
      case 'partner':
        return '🏛️';
      default:
        return '👤';
    }
  };

  const getRoleDescription = (roleType: UserRole) => {
    switch (roleType) {
      case 'student':
        return 'Apply to universities and track your applications';
      case 'agent':
        return 'Help students with their applications and earn commissions';
      case 'partner':
        return 'Manage university partnerships and applications';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 px-4 py-8">
        <Card className="w-full max-w-3xl shadow-2xl border-2 relative overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-muted">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-in-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

          <CardHeader className="space-y-1 text-center pt-8">
            <div className="flex justify-center mb-4">
              <BackButton
                variant="ghost"
                size="sm"
                fallback="/auth/login"
                label="Back to login"
                className="px-0 text-muted-foreground hover:text-foreground"
              />
            </div>

            <div className="flex justify-center mb-4">
              <img
                src={gegLogo}
                alt="GEG Logo"
                className="h-20 w-20 object-contain dark:brightness-0 dark:invert"
              />
            </div>

          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Join GEG
          </CardTitle>
          <CardDescription className="text-base">
            Step {step} of {totalSteps}: {step === 1 ? 'Choose Your Role' : step === 2 ? 'Personal Information' : 'Account Credentials'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 px-4 sm:px-8">
            {/* Step 1: Role Selection */}
            <div
              className={cn(
                'space-y-6 transition-all duration-500',
                step === 1 ? 'block opacity-100 translate-x-0' : 'hidden opacity-0 translate-x-full'
              )}
            >
              <div className="space-y-4">
                  <Label className="text-lg font-semibold flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  Select Account Type
                </Label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {ROLE_OPTIONS.map((roleType) => (
                      <button
                        key={roleType}
                        type="button"
                        onClick={() => setRole(roleType)}
                        className={cn(
                          'w-full rounded-2xl border-2 transition-all duration-300 text-left hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 px-5 py-4 sm:px-6 sm:py-6',
                          role === roleType
                            ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                          <span className="text-3xl sm:text-4xl">{getRoleIcon(roleType)}</span>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="font-semibold text-lg sm:text-xl capitalize">{roleType}</h3>
                              {role === roleType && (
                                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                              {getRoleDescription(roleType)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Step 2: Personal Information */}
            <div
              className={cn(
                'space-y-5 transition-all duration-500',
                step === 2 ? 'block opacity-100 translate-x-0' : 'hidden opacity-0 translate-x-full'
              )}
            >
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Country
                  </Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {countryOptions.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
            </div>

            {/* Step 3: Account Credentials */}
            <div
              className={cn(
                'space-y-5 transition-all duration-500',
                step === 3 ? 'block opacity-100 translate-x-0' : 'hidden opacity-0 translate-x-full'
              )}
            >
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <AtSign className="h-4 w-4" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      const normalized = formatReferralUsername(e.target.value);
                      setUsername(normalized);
                    }}
                    placeholder="choose-a-username"
                    className="h-11"
                    aria-invalid={usernameError ? true : undefined}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      This becomes your referral ID. Use lowercase letters, numbers, or underscores.
                    </p>
                    {checkingUsername && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Checking...
                      </span>
                    )}
                  </div>
                  {usernameError && (
                    <p className="text-xs text-destructive">{usernameError}</p>
                  )}
                </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum 6 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11"
                />
              </div>

                {refParam && (
                  <div className="rounded-lg border border-dashed border-muted p-3 text-sm">
                    {referrerLoading ? (
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Validating referral link...
                      </span>
                    ) : referrerInfo ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Referral link applied from <span className="font-semibold">@{referrerInfo.username}</span>
                        {referrerInfo.full_name ? ` (${referrerInfo.full_name})` : ''}.
                      </span>
                    ) : (
                      <span className="text-destructive">
                        {referrerError || 'This referral link is not valid. You can continue without it.'}
                      </span>
                    )}
                  </div>
                )}
            </div>
          </CardContent>

            <CardFooter className="flex flex-col space-y-4 px-4 pb-8 sm:px-8">
            {/* Navigation Buttons */}
            <div className="flex gap-3 w-full">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              
              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              )}
            </div>

            {step === 1 && (
              <>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignUp}
                  disabled={loading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
              </>
            )}

            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/auth/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Signup;
