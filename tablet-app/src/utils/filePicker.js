import { Alert, Platform } from 'react-native';

// Web-compatible file picker utilities
const isWeb = Platform.OS === 'web';

// Helper function for web file input
const createFileInput = (accept, multiple = false) => {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.multiple = multiple;

        input.onchange = async (e) => {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) {
                resolve(null);
                return;
            }

            const file = files[0];
            const reader = new FileReader();

            reader.onload = () => {
                resolve({
                    uri: reader.result,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                });
            };

            reader.readAsDataURL(file);
        };

        input.click();
    });
};

export const pickImage = async () => {
    if (isWeb) {
        // Web implementation using HTML5 File API
        return createFileInput('image/*');
    }

    // Native implementation
    const ImagePicker = await import('expo-image-picker');

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'You need to grant camera roll permissions to pick images.');
        return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
    });

    if (!result.canceled) {
        const asset = result.assets[0];
        return {
            uri: asset.uri,
            name: asset.fileName || `image_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
            size: asset.fileSize || 0,
        };
    }

    return null;
};

export const takePhoto = async () => {
    if (isWeb) {
        // Web doesn't support camera directly in the same way
        // Use media capture attribute
        Alert.alert('Info', 'Taking photo from camera is not supported on web. Please use "Pick from Gallery" instead.');
        return null;
    }

    // Native implementation
    const ImagePicker = await import('expo-image-picker');

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'You need to grant camera permissions to take photos.');
        return null;
    }

    const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
    });

    if (!result.canceled) {
        const asset = result.assets[0];
        return {
            uri: asset.uri,
            name: asset.fileName || `photo_${Date.now()}.jpg`,
            type: 'image/jpeg',
            size: asset.fileSize || 0,
        };
    }

    return null;
};

export const pickDocument = async () => {
    if (isWeb) {
        // Web implementation for document picking
        return createFileInput('*/*');
    }

    // Native implementation
    const DocumentPicker = await import('expo-document-picker');

    const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
    });

    if (result.type === 'success' || !result.canceled) {
        return {
            uri: result.uri,
            name: result.name,
            type: result.mimeType || 'application/octet-stream',
            size: result.size || 0,
        };
    }

    return null;
};
