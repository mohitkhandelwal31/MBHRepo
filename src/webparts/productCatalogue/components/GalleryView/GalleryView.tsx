import * as React from 'react';
import styles from './GalleryView.module.scss';



interface IGalleryViewProps {
    lights: any[];   
    setShowItemModal: (show: boolean,light: any) => void;
}

export default class GalleryView extends React.Component<IGalleryViewProps> {
    public render(): React.ReactElement {
        const { lights = [] } = this.props;

        return (
            <div className={styles.galleryView}>
                {lights.length === 0 ? (
                    <div className={styles.emptyState}>No lights available.</div>
                ) : (
                    <div className={styles.galleryGrid}>
                        {lights.map((light) => {
                            const imageUrl = light.ProductPicture?.Url || light.ProductPicture || '';

                            return (
                                <div
                                    onClick={() => {                                
                                        this.props.setShowItemModal(true, light);
                                    }}
                                    key={`${light.sourceList || 'light'}-${light.Id}`} className={styles.galleryItem}>
                                    {String(light.IsNew || '').trim().toLowerCase() === 'true' && (
                                        <span style={{ position: 'absolute', top: 8, left: 8, zIndex: 1, padding: '4px 8px', borderRadius: 4, background: '#d83b01', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>NEW</span>
                                    )}
                                    {imageUrl ? (
                                        <div className={styles.galleryContainer}>
                                            <img title={light.ProductCode} src={imageUrl} alt={light.Title || 'Light image'} className={styles.galleryImage} />
                                            <div className={styles.galleryImageText}>{light.ProductCode}</div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div title={light.ProductCode} className={styles.imagePlaceholder}>No image</div>
                                            <div className={styles.galleryImageText}>{light.ProductCode}</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }
}