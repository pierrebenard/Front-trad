import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Button from '../../inputComposant/Button';
import '../../../css/journal/recuperationImageJournal.css';
import { useGlobalImage } from '../../../variableGlobal/variableImage';

const RecuperationImageJournal = ({ imageIds }) => {
    const { globalImage, setGlobalImage } = useGlobalImage();
    const [imageURLs, setImageURLs] = useState([]);
    const [imageIdsFromAPI, setImageIdsFromAPI] = useState([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const [currentBlobUrl, setCurrentBlobUrl] = useState(null);

    const fetchImages = async () => {
        try {
            const imagePromises = imageIds.map(async (imageId) => {
                if (imageId !== null && imageId !== undefined && imageId !== "") {
                    const uniqueQueryParam = `timestamp=${Date.now()}`;
                    const response = await fetch(`https://apipython2.onrender.com/recuperationImage?imageId=${imageId}&${uniqueQueryParam}`, {
                        method: 'GET',
                        cache: 'no-store', // Désactive la mise en cache
                    });
    
                    if (!response.ok) {
                        throw new Error(`Réponse de l'API non valide. Statut : ${response.status}`);
                    }
    
                    const blob = await response.blob();
                    const imageUrl = URL.createObjectURL(blob);
    
                    const additionalInfoResponse = await axios.get(`https://apipython2.onrender.com/recuperationDonneeImage?imageId=${imageId}`);
                    const additionalInfo = additionalInfoResponse.data;
    
                    const idsFromAPI = response.headers.get('image_id');
                    if (idsFromAPI) {
                        setImageIdsFromAPI(idsFromAPI.split(','));
                    }
    
                    return {
                        imageUrl,
                        additionalInfo,
                    };
                }
            });
    
            const imagesWithInfo = await Promise.all(imagePromises);
            setImageURLs(imagesWithInfo);
        } catch (error) {
            console.error('erreur recuperation des images :', error);
        }
    };
    

    const suppressionImage = async (imageId) => {
        try {
            if (imageId !== null && imageId !== undefined && imageId !== "") {
                const response = await axios.delete(`https://apipython2.onrender.com/suppressionImage?id=${imageId}`);
                console.log('Image supprimée avec succès:', response.data);
                
                const updatedImageURLs = imageURLs.filter(imageInfo =>
                    !imageInfo.additionalInfo.image_ids.includes(imageId)
                );
                setImageURLs(updatedImageURLs);
                let randomVariable = Math.random();
                setGlobalImage(randomVariable);
                console.log(globalImage);
                return response.data;
            }
        } catch (error) {
            console.error('Une erreur est survenue lors de la suppression de l\'élément :', error);
            if (error.response) {
                console.error('Réponse de l\'API:', error.response.data);
            }
            throw error;
        }
    };

    const handleImageClick = (index) => {
        setSelectedImageIndex(index);
    };

    useEffect(() => {
        fetchImages();
    }, [globalImage]);

    // Assurez-vous de révoquer le lien blob lorsque le composant est démonté
    useEffect(() => {
        return () => {
            if (currentBlobUrl) {
                URL.revokeObjectURL(currentBlobUrl);
            }
        };
    }, [currentBlobUrl]);

    return (
        <div className='conteneurImage'>
            {imageURLs.map((imageInfo, index) => (
                <div key={index}>
                    <div className="imagePetit">
                        <img className='imagePetiteImg' src={imageInfo.imageUrl} alt="" onClick={() => handleImageClick(index)} />
                        <div className="suppressionImage">
                            <Button className="btnSupprimer" label='Supprimer' onClick={() => suppressionImage(imageInfo.additionalInfo.image_ids[index])} />
                        </div>
                    </div>
                    {selectedImageIndex !== null && (
                        <div className="imageGrandeConteneur">
                            <div className="imageGrande">
                                <img className='imageGrandeImg' src={imageInfo.imageUrl} alt="" />
                                <Button label='Fermer' onClick={() => setSelectedImageIndex(null)} />
                            </div>
                        </div>
                    )}
                </div>
            ))}
            {imageURLs == undefined || imageURLs.length < 1 ? (
                <p>Aucune image disponible.</p>
            ) : null}
        </div>
    );
};

export default RecuperationImageJournal;
