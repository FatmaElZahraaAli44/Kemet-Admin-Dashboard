export interface Place {
  placeID?: string;
  PlaceID: string;
  name: string;
  Name: string;

  description: string;
  Description: string;

  categoryName: string;
  CategoryName: string;

  culturalTips: string[];
  CulturalTips: string[];
  
  duration: string;
  Duration: string;

  egyptianAdult: number;
  touristAdultCost: number;
  EgyptianAdultCost: number;
  TouristAdultCost: number;
  TouristStudentCost: number;
  EgyptianStudentCost: number;
  egyptianStudent: number;
  touristAdult: number;
  touristStudent: number;

  address: string;
  Address: string;
  
  locationLink?: string;
  LocationLink?: string;
  
  latitude: number;
  Latitude: number;
  
  longitude: number;
  Longitude: number;

  imageURLs: {
    $id: string;
    $values: string[];
  };
  ImageURLs: string[]

  averageRating?: number;
  ratingsCount?: number;
  OpenTime: string;
  CloseTime: string;

  openTime:string;
  closeTime:string;
} 