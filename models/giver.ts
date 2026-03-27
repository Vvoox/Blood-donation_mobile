import {User} from "./user";

export interface Giver {
    giverId?: string;
    typeBlood?: string;
    user?: User;
    city?: string;
    isAvailable?: boolean;
    lastDonationDate?: string;
    nextAvailableDate?: string;
    totalDonations?: number;
    notes?: string;
}
