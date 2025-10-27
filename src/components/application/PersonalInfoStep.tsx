import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Calendar, Globe, CreditCard, MapPin } from 'lucide-react';

interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  currentCountry: string;
  address: string;
}

interface PersonalInfoStepProps {
  data: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
  onNext: () => void;
}

export default function PersonalInfoStep({ data, onChange, onNext }: PersonalInfoStepProps) {
  const handleChange = (field: keyof PersonalInfo, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const isValid = () => {
    return (
      data.fullName.trim() !== '' &&
      data.email.trim() !== '' &&
      data.phone.trim() !== '' &&
      data.dateOfBirth !== '' &&
      data.nationality.trim() !== '' &&
      data.currentCountry.trim() !== ''
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </CardTitle>
        <CardDescription>
          Your personal details have been pre-filled from your profile. Please review and update if
          needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Full Name *
          </Label>
          <Input
            id="fullName"
            value={data.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="Enter your full legal name"
            required
          />
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={data.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 234 567 8900"
              required
            />
          </div>
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date of Birth *
          </Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            required
          />
        </div>

        {/* Nationality & Current Country */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nationality" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Nationality *
            </Label>
            <Input
              id="nationality"
              value={data.nationality}
              onChange={(e) => handleChange('nationality', e.target.value)}
              placeholder="e.g., United States"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentCountry" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Current Country *
            </Label>
            <Input
              id="currentCountry"
              value={data.currentCountry}
              onChange={(e) => handleChange('currentCountry', e.target.value)}
              placeholder="e.g., Canada"
              required
            />
          </div>
        </div>

        {/* Passport Number */}
        <div className="space-y-2">
          <Label htmlFor="passportNumber" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Passport Number
          </Label>
          <Input
            id="passportNumber"
            value={data.passportNumber}
            onChange={(e) => handleChange('passportNumber', e.target.value)}
            placeholder="Enter your passport number"
          />
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Current Address
          </Label>
          <Input
            id="address"
            value={data.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Street address, City, State/Province"
          />
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={onNext} disabled={!isValid()} size="lg">
            Continue to Education History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
