import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { getAdminProducts, Product } from '@/data/products';

export default function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getAdminProducts();
      setProducts(data as unknown as Product[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (id: string, newStock: number) => {
    // AQUÍ ESTÁ EL UPDATE (Nunca INSERT para modificar stock existente)
    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', id);

    if (error) {
      Alert.alert('Error', 'No se pudo actualizar el stock');
    } else {
      Alert.alert('Éxito', 'Stock actualizado correctamente');
      fetchProducts(); // Recargar la lista
    }
  };

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.name}</Text>
      <View style={styles.row}>
        <Text>Stock actual: {item.stock}</Text>
        <TextInput 
          style={styles.input} 
          keyboardType="numeric" 
          placeholder="Nuevo stock"
          onSubmitEditing={(e) => updateStock(item.id, Number(e.nativeEvent.text))}
        />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={styles.header}>Control de Bodega</Text>
      <FlatList 
        data={products} 
        keyExtractor={(item) => item.id} 
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={fetchProducts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, elevation: 2 },
  title: { fontSize: 18, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, width: 100 }
});