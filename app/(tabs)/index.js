import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TextInput, SafeAreaView, ActivityIndicator, TouchableOpacity, Modal, ScrollView } from 'react-native';
// ▼▼▼ 1. IMPORTA EL COMPONENTE 'Link' ▼▼▼
import { useFocusEffect, Link } from 'expo-router';
import { getProducts } from '@/api/productService';
import { getAllCategories } from '@/api/categoryService'; // Importamos el nuevo servicio
import Svg, { Path } from 'react-native-svg';

const FilterIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></Path>
    </Svg>
);

export default function HomeScreen() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ category: 'all', price: 'all' });
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);

  const fetchProducts = useCallback(async (params, { isLoadMore = false, isFilterOrSearch = false }) => {
    if (isLoadMore) setLoadingMore(true);
    
    try {
      const response = await getProducts(params);
      const responseData = response.data;
      const productsData = Array.isArray(responseData.products) ? responseData.products : [];
      
      setProducts(prev => isLoadMore ? [...prev, ...productsData] : productsData);
      setPage(responseData.currentPage);
      setTotalPages(responseData.totalPages);
      setError(null);
    } catch (err) {
      console.error("Error al obtener productos:", err);
      setError("No se pudieron cargar los productos.");
    } finally {
      if (isLoadMore) setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setSearchQuery('');
      setFilters({ category: 'all', price: 'all' });
      
      const loadInitialData = async () => {
        try {
          // Cargamos categorías y la primera página de productos al mismo tiempo
          const [categoriesResponse] = await Promise.all([
            getAllCategories(),
            fetchProducts({ page: 1, category: 'all', price: 'all' }, {})
          ]);
          setCategories(categoriesResponse.data);
        } catch (catError) {
          console.error("Error al cargar categorías:", catError);
        } finally {
          setLoading(false);
        }
      };
      
      loadInitialData();
    }, [])
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      if (!loading) {
        fetchProducts({ page: 1, ...filters, search: searchQuery }, { isFilterOrSearch: true });
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleLoadMore = () => {
    if (loadingMore || page >= totalPages) return;
    fetchProducts({ page: page + 1, ...filters, search: searchQuery }, { isLoadMore: true });
  };

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
    fetchProducts({ page: 1, ...newFilters, search: searchQuery }, { isFilterOrSearch: true });
  };
  
  const renderFilterModal = () => (
    <Modal visible={isFilterModalVisible} animationType="slide" transparent={true} onRequestClose={() => setFilterModalVisible(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filtros</Text>
          <ScrollView>
            <Text style={styles.filterSectionTitle}>Categoría</Text>
            <TouchableOpacity style={styles.filterOption} onPress={() => applyFilters({ ...filters, category: 'all' })}>
              <Text>Todas las categorías</Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity key={cat._id} style={styles.filterOption} onPress={() => applyFilters({ ...filters, category: cat.name })}>
                <Text>{cat.name}</Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.filterSectionTitle}>Precio</Text>
            <TouchableOpacity style={styles.filterOption} onPress={() => applyFilters({ ...filters, price: '500' })}>
              <Text>Hasta $500</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterOption} onPress={() => applyFilters({ ...filters, price: '1000' })}>
              <Text>$501 a $1000</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterOption} onPress={() => applyFilters({ ...filters, price: 'more' })}>
              <Text>Más de $1000</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterOption} onPress={() => applyFilters({ ...filters, price: 'all' })}>
              <Text style={{fontWeight: 'bold'}}>Quitar filtro de precio</Text>
            </TouchableOpacity>
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={() => setFilterModalVisible(false)}>
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderFooter = () => {
    if (loadingMore) return <ActivityIndicator style={{ marginVertical: 20 }} size="large" />;
    if (page < totalPages) {
      return (
        <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
          <Text style={styles.loadMoreButtonText}>Cargar más</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#333" /></View>;
  }

  if (error) {
    return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {renderFilterModal()}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
            <FilterIcon />
          </TouchableOpacity>
        </View>

        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            // ▼▼▼ 2. REEMPLAZA TouchableOpacity CON Link ▼▼▼
            <Link href={`/product/${item._id}`} asChild>
              <TouchableOpacity style={styles.productCard}>
                <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            </Link>
          )}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={() => (
            <View style={styles.centered}>
              <Text>No se encontraron productos.</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  searchInput: { flex: 1, backgroundColor: '#F0F0F0', borderRadius: 8, padding: 10, fontSize: 16 },
  filterButton: { marginLeft: 10, padding: 5 },
  listContent: { padding: 5 },
  productCard: { flex: 1, margin: 5, backgroundColor: '#FFFFFF', borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41 },
  productImage: { width: '100%', height: 180, borderTopLeftRadius: 8, borderTopRightRadius: 8, resizeMode: 'cover' },
  productInfo: { padding: 10 },
  productName: { fontSize: 14, fontWeight: '500' },
  productPrice: { fontSize: 16, fontWeight: 'bold', marginTop: 5, color: '#333333' },
  loadMoreButton: { margin: 15, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 8, alignItems: 'center' },
  loadMoreButtonText: { fontSize: 16, fontWeight: 'bold' },
  // Modal Styles
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  filterSectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  filterOption: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  closeButton: { marginTop: 20, padding: 15, backgroundColor: '#3466f6', borderRadius: 8, alignItems: 'center' },
  closeButtonText: { color: 'white', fontWeight: 'bold' },
});
