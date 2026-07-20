import { Schema, model, Document, Types } from "mongoose";

export interface ITicket extends Document {
  tenantId: Types.ObjectId;
  candidateId: Types.ObjectId;
  pipelineId: Types.ObjectId;
  airline?: string;
  flightNumber?: string;
  pnr?: string;
  departureDatetime?: Date;
  arrivalDatetime?: Date;
  departureAirport?: string;
  arrivalAirport?: string;
  airportPickup: {
    arranged: boolean;
    contactName?: string;
    contactPhone?: string;
  };
  ticketPdfUrl?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: "Candidate", required: true },
    pipelineId: { type: Schema.Types.ObjectId, ref: "Pipeline", required: true },
    airline: String,
    flightNumber: String,
    pnr: String,
    departureDatetime: Date,
    arrivalDatetime: Date,
    departureAirport: String,
    arrivalAirport: String,
    airportPickup: {
      arranged: { type: Boolean, default: false },
      contactName: String,
      contactPhone: String
    },
    ticketPdfUrl: String,
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

ticketSchema.index({ tenantId: 1, candidateId: 1, pipelineId: 1 });

export const Ticket = model<ITicket>("Ticket", ticketSchema);
