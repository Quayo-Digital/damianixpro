
import { supabase } from '@/integrations/supabase/client';
import { Property, PropertyFormValues } from '../types';
import { uploadPropertyDocuments, deletePropertyDocuments } from '../documentService';

/**
 * Create a new property
 */
export const createProperty = async (propertyData: PropertyFormValues, documents: File[] = []): Promise<Property> => {
  try {
    const dataToInsert = {
      name: propertyData.name,
      address: propertyData.address,
      type: propertyData.type,
      price: propertyData.price,
      location: propertyData.location,
      status: propertyData.status,
      description: propertyData.description,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      squareFeet: propertyData.squareFeet,
      amenities: propertyData.amenities,
      lease_terms: propertyData.lease_terms,
      availability_date: propertyData.availability_date,
      agent_id: propertyData.agent_id === 'none' ? null : propertyData.agent_id,
      features: propertyData.features,
      owner_id: propertyData.owner_id,
      imageUrl: propertyData.imageUrl,
      latitude: propertyData.latitude ? parseFloat(propertyData.latitude) : null,
      longitude: propertyData.longitude ? parseFloat(propertyData.longitude) : null,
      agent_commission_rate: propertyData.agent_commission_rate ? parseFloat(propertyData.agent_commission_rate) : null,
      tour_url: propertyData.tourUrl || null,
    };

    // First, create the property record
    const { data, error } = await supabase
      .from('properties')
      .insert([dataToInsert])
      .select();
    
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Failed to create property');
    
    const property = data[0] as Property;
    
    // Then upload any documents if provided
    if (documents.length > 0) {
      await uploadPropertyDocuments(property.id, documents);
    }
    
    return property;
  } catch (error) {
    console.error('Error creating property:', error);
    throw error;
  }
};

/**
 * Update an existing property
 */
export const updateProperty = async (id: string, propertyData: PropertyFormValues, documents: File[] = []): Promise<Property> => {
  try {
    const dataToUpdate = {
      name: propertyData.name,
      address: propertyData.address,
      type: propertyData.type,
      price: propertyData.price,
      location: propertyData.location,
      status: propertyData.status,
      description: propertyData.description,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      squareFeet: propertyData.squareFeet,
      amenities: propertyData.amenities,
      lease_terms: propertyData.lease_terms,
      availability_date: propertyData.availability_date,
      agent_id: propertyData.agent_id === 'none' ? null : propertyData.agent_id,
      features: propertyData.features,
      owner_id: propertyData.owner_id,
      imageUrl: propertyData.imageUrl,
      latitude: propertyData.latitude ? parseFloat(propertyData.latitude) : null,
      longitude: propertyData.longitude ? parseFloat(propertyData.longitude) : null,
      agent_commission_rate: propertyData.agent_commission_rate ? parseFloat(propertyData.agent_commission_rate) : null,
      tour_url: propertyData.tourUrl || null,
    };
    
    // Update the property record
    const { data, error } = await supabase
      .from('properties')
      .update(dataToUpdate)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Failed to update property');
    
    // Upload any new documents if provided
    if (documents.length > 0) {
      await uploadPropertyDocuments(id, documents);
    }
    
    return data[0] as Property;
  } catch (error) {
    console.error('Error updating property:', error);
    throw error;
  }
};

/**
 * Delete a property by ID
 */
export const deleteProperty = async (id: string): Promise<boolean> => {
  try {
    // First delete any associated documents
    await deletePropertyDocuments(id);
    
    // Then delete the property
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting property:', error);
    throw error;
  }
};
