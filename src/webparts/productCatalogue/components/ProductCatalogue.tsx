import * as React from 'react';
import styles from './ProductCatalogue.module.scss';
import type { IProductCatalogueProps } from './IProductCatalogueProps';
import { DocumentCard, DocumentCardDetails } from '@fluentui/react/lib/DocumentCard';
import { Modal } from '@fluentui/react/lib/Modal';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { TextField } from '@fluentui/react/lib/TextField';
// import { IconButton } from '@fluentui/react/lib/Button';
import spservices from '../../Services/spservices';
import InventoryForm from './InventoryForm';
import { PrimaryButton } from 'office-ui-fabric-react/lib/components/Button/PrimaryButton/PrimaryButton';
// import { Toggle } from '@fluentui/react';
import GalleryView from './GalleryView/GalleryView';
import { Toggle } from '@fluentui/react/lib/Toggle';

export interface IProductCatalogueState {
  lights: any[];
  inventoryItems: any[];
  showModal: boolean;
  selectedLight: any;
  selectedCategory: string;
  searchTerm: string;
  isSiteOwner: boolean;
  showImageOrProductView: boolean;
  showActualPrice: boolean;
}

// Combined category options for merged results
const lightCategoryOptions: IDropdownOption[] = [
  { key: 'All', text: 'All Categories' },
  { key: 'Hanging Light', text: 'Hanging Light' },
  { key: 'Wall Light', text: 'Wall Light' },
  { key: 'Chandelier', text: 'Chandelier' },
  { key: 'Elevation Light', text: 'Elevation Light' },
  { key: 'Mirror Light', text: 'Mirror Light' }
];

export default class ProductCatalogue extends React.Component<IProductCatalogueProps, IProductCatalogueState> {
  private spServices: spservices;
  private inventoryFormRef: React.RefObject<InventoryForm>;
  private pageScrollPositions: Array<{ element: HTMLElement; top: number; left: number }> = [];
  constructor(props: IProductCatalogueProps) {
    super(props);
    this.state = {
      lights: [],
      inventoryItems: [],
      showModal: false,
      selectedLight: null,
      selectedCategory: 'All',
      searchTerm: '',
      isSiteOwner: false,
      showImageOrProductView: true,
      showActualPrice: false
    };
    this.spServices = new spservices(props.context.pageContext);
    this.inventoryFormRef = React.createRef<InventoryForm>();
  }

  componentDidMount(): void {
    this.checkSiteOwnerGroup();
    this.getDataBasedOnLightType();
  }

  private checkSiteOwnerGroup = async (): Promise<void> => {
    try {
      const isSiteOwner = await this.spServices.isCurrentUserInOwnersGroup();
      this.setState({ isSiteOwner });
    } catch (error) {
      console.error('Error checking site owner group:', error);
    }
  }

  private refreshInventory = () => {
    this.getDataBasedOnLightType();
  }

  private renderLightCard = (light: any) => {
    return (
      <DocumentCard key={light.Id} className={light.availableQuantity > 0 ? styles.lightCard : styles.lightCardOutOfStock}>
        <DocumentCardDetails>
          <div style={{ position: 'relative' }}>
            <img src={light.ProductPicture?.Url} alt={light.ProductPicture?.Url} style={{ width: '100%', height: '200px', objectFit: 'fill' }} />
            {String(light.IsNew || '').trim().toLowerCase() === 'true' && (
              <span style={{ position: 'absolute', top: 8, left: 8, padding: '4px 8px', borderRadius: 4, background: '#d83b01', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>NEW</span>
            )}
          </div>
          <div className={styles.titleContainer}>
            <div>{light.Title}</div>
          </div>
          <div className={styles.priceContainer}>
            <div className={styles.attribute}>Price</div>
            <div className={styles.attributeValue}>{light.Price?.toFixed(2)}</div>
          </div>
          {this.state.isSiteOwner && this.state.showActualPrice && (
            <div className={styles.actualPriceContainer}>
              <div className={styles.attribute}>A.Price</div>
              <div className={styles.attributeValue}>{light.Actualprice?.toFixed(2)}</div>
            </div>
          )}
          <div className={styles.productContainer}>
            <div className={styles.attribute}>Product Code</div>
            <div className={styles.attributeValue}>{light.ProductCode}</div>
          </div>
          <div className={styles.colorContainer}>
            <div className={styles.attribute}>Color</div>
            <div className={styles.attributeValue}>{light.Color}</div>
          </div>
          <div className={styles.quantityContainer}>
            <div className={styles.attribute}>Quantity</div>
            <div className={styles.attributeValue}>{light.availableQuantity}</div>
          </div>
        </DocumentCardDetails>
      </DocumentCard>
    );
  }

  private getDataBasedOnLightType = async () => {
    try {
      // Fetch both decorative lights and lights in parallel
      const [decorativeLights, lights, inventoryItems] = await Promise.all([
        this.spServices.getDecorativeLightsItems(this.props.context),
        this.spServices.getLightsItems(this.props.context),
        this.spServices.getInventoryItems(this.props.context)
      ]);

      const inventoryImpactByCode = inventoryItems.reduce((acc: Record<string, { added: number; sold: number }>, item: any) => {
        const key = (item.ProductCode || '').toString().trim().toLowerCase();
        const quantity = Number(item.Quantity) || 0;
        if (!key || quantity === 0) {
          return acc;
        }
        const eventType = (item.Event || 'Added').toString().trim().toLowerCase();
        if (!acc[key]) {
          acc[key] = { added: 0, sold: 0 };
        }
        if (eventType === 'sold') {
          acc[key].sold += quantity;
        } else {
          acc[key].added += quantity;
        }
        return acc;
      }, {});

      const mergedLights: any[] = [
        ...decorativeLights.map(item => ({ ...item, sourceList: 'Decorative' })),
        ...lights.map(item => ({ ...item, sourceList: 'Lights' }))
      ].map(light => {
        const code = (light.ProductCode || '').toString().trim().toLowerCase();
        const inventoryImpact = inventoryImpactByCode[code] || { added: 0, sold: 0 };
        const availableQuantity = Math.max(0, (Number(light.Quantity) || 0) + inventoryImpact.added - inventoryImpact.sold);
        return {
          ...light,
          availableQuantity,
          originalQuantity: Number(light.Quantity) || 0
        };
      });

      this.setState({ lights: mergedLights, inventoryItems });
    } catch (error) {
      console.error("Error fetching merged lights items:", error);
    }
  }
  navigateUrl = (navigateURL: string) => {
    window.open(navigateURL, '_self');
  };

  onViewChange = (_ev: React.MouseEvent<HTMLElement>, checked?: boolean) => {
    this.setState({
      showImageOrProductView: !!checked
    });
  }

  setShowItemModal = (show: boolean, light: any) => {
    if (!show) {
      this.closeItemModal();
      return;
    }
    this.capturePageScroll();
    this.setState({
      showModal: true,
      selectedLight: light
    });
    this.restorePageScroll();
  }

  private openItemModal = (light: any): void => {
    this.capturePageScroll();
    this.setState({ showModal: true, selectedLight: light });
    this.restorePageScroll();
  }

  private closeItemModal = (): void => {
    this.setState({ showModal: false }, () => {
      this.restorePageScroll();
      window.setTimeout(this.restorePageScroll, 100);
    });
  }

  private capturePageScroll = (): void => {
    const scrollableElements = document.querySelectorAll<HTMLElement>('body, html, *');
    this.pageScrollPositions = [];
    for (let index = 0; index < scrollableElements.length; index++) {
      const element: HTMLElement = scrollableElements[index];
      if (element.scrollTop > 0 || element.scrollLeft > 0) {
        this.pageScrollPositions.push({
          element,
          top: element.scrollTop,
          left: element.scrollLeft
        });
      }
    }
    this.pageScrollPositions.push({
      element: document.documentElement,
      top: window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop,
      left: window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft
    });
  }

  private restorePageScroll = (): void => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        this.pageScrollPositions.forEach(({ element, top, left }) => {
          if (element.isConnected) {
            element.scrollTop = top;
            element.scrollLeft = left;
          }
        });
        const documentPosition = this.pageScrollPositions[this.pageScrollPositions.length - 1];
        window.scrollTo(documentPosition.left, documentPosition.top);
      });
    });
  }

  public render(): React.ReactElement<IProductCatalogueProps> {
    const {

    } = this.props;

    let filteredLights = []
    filteredLights = this.state.selectedCategory === 'All'
      ? this.state.lights
      : this.state.lights.filter(light => light.Category === this.state.selectedCategory);

    if (this.state.searchTerm && this.state.searchTerm.trim() !== '') {
      const searchLower = this.state.searchTerm.toLowerCase().trim();
      filteredLights = filteredLights.filter(light =>
        (light.Title && light.Title.toLowerCase().includes(searchLower)) ||
        (light.ProductCode && light.ProductCode.toLowerCase().includes(searchLower))
      );
    }

    const hasProductImage = (light: any): boolean => Boolean(
      light.ProductPicture?.Url ||
      light.ProductPicture?.ServerRelativeUrl ||
      (typeof light.ProductPicture === 'string' && light.ProductPicture.trim())
    );
    const inStockLights = filteredLights.filter(light => light.availableQuantity > 0);
    const inStockLightsWithImage = inStockLights.filter(hasProductImage);
    const inStockLightsWithoutImage = inStockLights.filter(light => !hasProductImage(light));
    const outOfStockLights = filteredLights.filter(light => light.availableQuantity === 0);
    const sortedLights = [...inStockLightsWithImage, ...inStockLightsWithoutImage, ...outOfStockLights];

    return (
      <section className={styles.productCatalogue}>
        <div>
          <div className={styles.buttonContainer}>
            <InventoryForm
              ref={this.inventoryFormRef}
              context={this.props.context}
              onInventoryUpdated={this.refreshInventory}
              lights={this.state.lights}
              isSiteOwner={this.state.isSiteOwner}
            />
            <div>
              <PrimaryButton
                text="Admin Dashboard"
                onClick={() => this.navigateUrl(this.props.adminDashboard)}
                styles={{ root: { marginRight: 10 } }}
              />
            </div>
            <div>
              <PrimaryButton
                text="Inventory"
                onClick={() => this.navigateUrl(this.props.inventoryList)}
                styles={{ root: { marginRight: 10 } }}
              />
            </div>
          </div>
          <div className={styles.toggleContainer}>
            {this.state.isSiteOwner && (
              <Toggle
                checked={this.state.showActualPrice}
                onChange={(_event, checked) => this.setState({ showActualPrice: !!checked })}
                label="Show Actual Price"
                inlineLabel={true}
              />
            )}
            <Toggle
              checked={this.state.showImageOrProductView}
              onChange={this.onViewChange}
              label={this.state.showImageOrProductView ? "Product View" : "Image View"}
              inlineLabel={true}
            />
          </div>
        </div>
        <div style={{ placeItems: "center" }}>
          <div className={styles.dropdownContainer}>
            <Dropdown
              label="Select Category"
              selectedKey={this.state.selectedCategory}
              options={lightCategoryOptions}
              onChange={(event, option) => this.setState({ selectedCategory: option?.key as string })}
              styles={{ dropdown: { width: 300, borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }, label: { fontWeight: 600 } }}
            />
          </div>
          <div className={styles.searchContainer}>
            <TextField
              label="Search by Name or Product Code"
              value={this.state.searchTerm}
              onChange={(event, newValue) => this.setState({ searchTerm: newValue || '' })}
              styles={{ fieldGroup: { width: 300, borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' } }}
              placeholder="Enter product name or code..."
            />
          </div>
        </div>
        {this.state.showImageOrProductView ?
          <div className={styles.lightsList}>
            <div className={styles.lightsGrid}>
              {sortedLights.map(light => (
                <div key={`${light.sourceList}-${light.Id}`} onClick={() => this.openItemModal(light)}>
                  {this.renderLightCard(light)}
                </div>
              ))}
            </div>


          </div>
          :
          <GalleryView lights={sortedLights} setShowItemModal={this.setShowItemModal}></GalleryView>
        }
        <Modal
          isOpen={this.state.showModal}
          onDismiss={this.closeItemModal}
          isBlocking={false}
          isModeless={false}
          focusTrapZoneProps={{ disableRestoreFocus: true }}
        >
          {this.state.selectedLight && (
            <div className={styles.modalContainer}>
              <h2>{this.state.selectedLight.Title}</h2>
              <img src={this.state.selectedLight.ProductPicture?.Url} alt={this.state.selectedLight.Title} style={{ width: '100%', maxWidth: '500px' }} />
              {/* Assuming more images are in a field like Images */}
              {this.state.selectedLight.Images && this.state.selectedLight.Images.map((img: string, index: number) => (
                <img key={index} src={img} alt={`${this.state.selectedLight.Title} ${index + 1}`} style={{ width: '100%', maxWidth: '200px', margin: '10px' }} />
              ))}
            </div>
          )}
        </Modal>
      </section>
    );
  }
}
