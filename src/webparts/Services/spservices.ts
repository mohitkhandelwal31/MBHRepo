import { RequestDigest, SPFI, spfi, SPFx } from '@pnp/sp';
import { WebPartContext } from "@microsoft/sp-webpart-base";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";

export default class spservices {
    protected sp: SPFI;
    public constructor(pageContext: any) {
        if (!this.sp) {
            this.sp = spfi().using(RequestDigest(), SPFx({ pageContext: pageContext }));
        }
    }

    getDecorativeLightsItems = async (context: WebPartContext): Promise<any[]> => {
        try {
            const items = await this.sp.web.lists.getByTitle("Decorative lights").items.select("Id", "Title", "Price", "ProductCode", "Quantity", "ProductPicture")();
            return items;
        } catch (error) {
            console.error("Error fetching items from Decorative lights list:", error);
            throw error;
        }
    };
}