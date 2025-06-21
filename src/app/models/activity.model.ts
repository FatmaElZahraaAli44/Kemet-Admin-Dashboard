export interface Activity {
  Id: string;
  activityId: string;
  placeID?: string;
  name: string;
  description: string;
  categoryName: string;
  culturalTips: string[];
  duration: string;
  egyptianAdult: number;
  egyptianStudent: number;
  touristAdult: number;
  touristStudent: number;
  address: string;
  locationLink?: string;
  latitude: number;
  longitude: number;
  openTime: string;
  closeTime: string;
  imageURLs?: {
    $values: string[];
  };
  reviews?: {
    $id: string;
  };
  averageRating?: number;
  ratingsCount?: number;
  groupSize?: number;
}


