import * as React from 'react';
import styles from './GalleryView.module.scss';



interface IGalleryViewProps {
    lights: any[];  
}

export default class GalleryView extends React.Component<IGalleryViewProps> {
    public render(): React.ReactElement {
        return (
            <>
            <div className={styles.galleryView}>

            </div>
            </>
        );
    }

}