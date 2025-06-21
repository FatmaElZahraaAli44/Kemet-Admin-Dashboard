export interface Agency {
  id: string;
  agencyName: string;
  profileImage?: string;
  phoneNumber: string;
  email: string;
  website?: string;
  location: string;
  description: string;
  numberOfPackages?: number;
  rate: number;
  joinedOn?: Date;
  bio?: string;
  facebookURL?: string;
  instagramURL?: string;
  backgroundURL?: string;
  taxNumber?: string;
} 