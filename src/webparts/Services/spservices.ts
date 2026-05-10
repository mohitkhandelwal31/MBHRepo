import { RequestDigest, SPFI, spfi, SPFx } from '@pnp/sp';
import { WebPartContext } from "@microsoft/sp-webpart-base";
import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";
import "@pnp/sp/lists";
import "@pnp/sp/items";

export default class spservices {
    protected sp!: SPFI;
    public constructor(pageContext: any) {
        if (!this.sp) {
            this.sp = spfi().using(RequestDigest(), SPFx({ pageContext: pageContext }));
        }
    }

    getDecorativeLightsItems = async (context: WebPartContext): Promise<any[]> => {
        try {
            const items = await this.sp.web.lists.getByTitle("Decorative lights").items.select("Id", "Title", "Price", "ProductCode", "Quantity", "ProductPicture", "Category","Actualprice")();
            return items;
        } catch (error) {
            console.error("Error fetching items from Decorative lights list:", error);
            throw error;
        }
    };
    getLightsItems = async (context: WebPartContext): Promise<any[]> => {
        try {
            const items = await this.sp.web.lists.getByTitle("Lights").items.select("Id", "Title", "Price", "ProductCode", "Quantity", "ProductPicture", "Category","Color","CompanyType","Actualprice")();
            return items;
        } catch (error) {
            console.error("Error fetching items from Lights list:", error);
            throw error;
        }
    };

    getInventoryItems = async (context: WebPartContext): Promise<any[]> => {
        try {
            const items = await this.sp.web.lists.getByTitle("Inventory").items.select("Id", "Title", "ProductCode", "Quantity", "Price", "Created","Event")();
            return items;
        } catch (error) {
            console.error("Error fetching items from Inventory list:", error);
            throw error;
        }
    };

    isCurrentUserInOwnersGroup = async (): Promise<boolean> => {
        try {
            const groups = await this.sp.web.currentUser.groups();
            return groups.some((group: any) => /MBH Owners$/i.test(group.Title));
        } catch (error) {
            console.error("Error checking user group membership:", error);
            return false;
        }
    };

    addInventory = async (context: WebPartContext, itemData: any): Promise<any> => {
        try {
            const result = await this.sp.web.lists.getByTitle("Inventory").items.add(itemData);
            return result;
        } catch (error) {
            console.error("Error adding item to Inventory list:", error);
            throw error;
        }
    };

    
}