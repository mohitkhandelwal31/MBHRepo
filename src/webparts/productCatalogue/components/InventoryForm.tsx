import * as React from 'react';
import styles from './ProductCatalogue.module.scss';
import { TextField } from '@fluentui/react/lib/TextField';
// import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { PrimaryButton, DefaultButton } from '@fluentui/react/lib/Button';
import { Dialog, DialogType, DialogFooter } from '@fluentui/react/lib/Dialog';
import spservices from '../../Services/spservices';

export interface IInventoryFormState {
    showForm: boolean;
    isEditMode: boolean;
    formData: {
        Id?: number;
        Title: string;
        ProductCode: string;
        Price: number;
        Quantity: number;
        Category: string;
        Color?: string;
        CompanyType?: string;
        ProductPicture?: any;
    };
    listType: 'decorative' | 'standard';
    productImageUrl: string | null;
    Category: string;
    searchedProduct: any | null;
}

// const categoryOptions: IDropdownOption[] = [
//     { key: 'Hanging Light', text: 'Hanging Light' },
//     { key: 'Wall Light', text: 'Wall Light' },
//     { key: 'Chandelier', text: 'Chandelier' },
//     { key: 'Elevation Light', text: 'Elevation Light' },
//     { key: 'Mirror Light', text: 'Mirror Light' }
// ];

interface IInventoryFormProps {
    context: any;
    onInventoryUpdated: () => void;
    lights: any[];
}

export default class InventoryForm extends React.Component<IInventoryFormProps, IInventoryFormState> {
    private spServices: spservices;

    constructor(props: IInventoryFormProps) {
        super(props);
        this.state = {
            showForm: false,
            isEditMode: false,
            formData: {
                Title: '',
                ProductCode: '',
                Price: 0,
                Quantity: 0,
                Category: '',
                Color: '',
                CompanyType: ''
            },
            listType: 'decorative',
            productImageUrl: null,
            searchedProduct: null,
            Category: ''
        };
        this.spServices = new spservices(props.context.pageContext);
    }

    private openAddForm = () => {
        this.setState({
            showForm: true,
            isEditMode: false,
            formData: {
                Title: '',
                ProductCode: '',
                Price: 0,
                Quantity: 0,
                Category: '',
                Color: '',
                CompanyType: ''
            },
            listType: 'decorative'
        });
    }

    private closeForm = () => {
        this.setState({ showForm: false });
    }

    private searchProductByCode = async (productCode: string) => {
        if (!productCode || productCode.trim() === '') {
            this.setState({ productImageUrl: null, searchedProduct: null });
            return;
        }
        try {
            let foundProduct: any = this.props.lights.filter(light => light.ProductCode === productCode);
            if (foundProduct.length > 0) {
                this.setState({
                    productImageUrl: foundProduct[0].ProductPicture?.Url || null,
                    searchedProduct: foundProduct,
                    Category: foundProduct[0].Category || ''
                });
            } else {
                this.setState({ productImageUrl: null, searchedProduct: null, Category: '' });
            }
        } catch (error) {
            console.error('Error searching product by code:', error);
            this.setState({ productImageUrl: null, searchedProduct: null });
        }
    }

    private handleInputChange = (field: string, value: any) => {
        this.setState(prevState => ({
            formData: {
                ...prevState.formData,
                [field]: value
            }
        }));

        // If product code changed, search for the product
        if (field === 'ProductCode') {
            this.searchProductByCode(value);
        }
    }

    private handleSubmit = async () => {
        try {
            const { formData } = this.state;

            // Validate required fields
            if (!formData.Title || !formData.ProductCode || !formData.Quantity || !formData.Price) {
                alert('Please fill in all required fields (Title, Product Code, Quantity, Price)');
                return;
            }
            else if (!this.state.searchedProduct || this.state.searchedProduct.length === 0) {
                alert('Product Code does not match any existing product. Please enter a valid Product Code to see the image.');
                return;
            }
            const itemData = {
                Title: formData.Title,
                ProductCode: formData.ProductCode,
                Price: formData.Price,
                Quantity: formData.Quantity,
                Category: this.state.Category,
                Date: new Date().toISOString()
            };
            // Add new item
            await this.spServices.addInventory(this.props.context, itemData);
            alert('New inventory item added successfully!');

            this.closeForm();
            this.props.onInventoryUpdated(); // Refresh the parent component
        } catch (error) {
            console.error('Error saving inventory item:', error);
            alert('Error saving inventory item. Please try again.');
        }
    }

    public render(): React.ReactElement {
        const { showForm, isEditMode, formData } = this.state;

        return (
            <div className={styles.inventoryForm}>
                <div className={styles.formActions}>
                    <PrimaryButton
                        text="Add inventory"
                        onClick={this.openAddForm}
                        styles={{ root: { marginRight: 10 } }}
                    />
                </div>
                <Dialog
                    hidden={!showForm}
                    onDismiss={this.closeForm}
                    dialogContentProps={{
                        type: DialogType.largeHeader,
                        title: 'Add New Inventory Item',
                        subText: 'Manage your light inventory'
                    }}
                    modalProps={{
                        isBlocking: false,
                        styles: { main: { maxWidth: 500 } }
                    }}
                >
                    <div className={styles.formContainer}>
                        <TextField
                            label="Person Name"
                            value={formData.Title}
                            onChange={(event, newValue) => this.handleInputChange('Title', newValue)}
                            required
                            styles={{ fieldGroup: { marginBottom: 15 } }}
                        />
                        {/* <Dropdown
                            label="Category"
                            selectedKey={formData.Category}
                            options={categoryOptions}
                            onChange={(event, option) => this.handleInputChange('Category', option?.key as string)}
                            styles={{ dropdown: { marginBottom: 15 } }}
                        /> */}                        
                        <TextField
                            label="Product Code"
                            value={formData.ProductCode}
                            onChange={(event, newValue) => this.handleInputChange('ProductCode', newValue)}
                            required
                            placeholder="Enter product code to see image"
                            styles={{ fieldGroup: { marginBottom: 15 } }}
                        />
                         <TextField
                            label="Category"
                            value={this.state.Category}                                                       
                            styles={{ fieldGroup: { marginBottom: 15 } }}
                            disabled
                        />
                        {this.state.productImageUrl && (
                            <div style={{ marginBottom: 15, textAlign: 'center' }}>
                                <img
                                    src={this.state.productImageUrl}
                                    alt="Product"
                                    style={{
                                        maxWidth: '200px',
                                        maxHeight: '200px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        padding: '5px'
                                    }}
                                />
                                <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                                    {this.state.searchedProduct?.Title || 'Product found'}
                                </p>
                            </div>
                        )}
                        <TextField
                            label="Price"
                            type="number"
                            value={formData.Price.toString()}
                            onChange={(event, newValue) => this.handleInputChange('Price', parseFloat(newValue || '0'))}
                            styles={{ fieldGroup: { marginBottom: 15 } }}
                             required
                        />
                        <TextField
                            label="Quantity"
                            type="number"
                            value={formData.Quantity.toString()}
                            onChange={(event, newValue) => this.handleInputChange('Quantity', parseInt(newValue || '0'))}
                            styles={{ fieldGroup: { marginBottom: 15 } }}
                             required
                        />
                    </div>
                    <DialogFooter>
                        <PrimaryButton onClick={this.handleSubmit} text={isEditMode ? 'Update' : 'Add'} />
                        <DefaultButton onClick={this.closeForm} text="Cancel" />
                    </DialogFooter>
                </Dialog>
            </div>
        );
    }

}