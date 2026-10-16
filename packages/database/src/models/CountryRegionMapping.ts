import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICountryRegionMapping extends Document {
  countryCode: string;
  countryName: string;
  regionCode: string;
  regionName: string;
  createdAt: Date;
  updatedAt: Date;
}

const CountryRegionMappingSchema = new Schema<ICountryRegionMapping>(
  {
    countryCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      length: 2,
      index: true,
    },
    countryName: {
      type: String,
      required: true,
      trim: true,
    },
    regionCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    regionName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'country_region_mappings',
  }
);

export const CountryRegionMapping: Model<ICountryRegionMapping> =
  mongoose.models.CountryRegionMapping ||
  mongoose.model<ICountryRegionMapping>('CountryRegionMapping', CountryRegionMappingSchema);
