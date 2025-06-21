export interface Customer {
  $id?: string;
  id?: string;
  userName: string;
  email: string;
  phoneNumber: string;
  imageURL?: string;
  // Keep the original fields as optional
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  nationality?: string;
  location?: string;
  ssn?: string;
  website?: string;
  joinedOn?: string;
  profileImage?: string;
  bio?: string;
  // Add any additional fields that might be in the API response
  [key: string]: any;
} 