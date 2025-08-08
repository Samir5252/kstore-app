import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TextInput, SafeAreaView, ActivityIndicator, TouchableOpacity, Modal, ScrollView, Platform, StatusBar, Animated } from 'react-native';
import { useFocusEffect, Link } from 'expo-router';
import { getProducts } from '@/api/productService';
import { getAllCategories } from '@/api/categoryService';
import { addItemToCart } from '@/api/cartService';
import { useCart } from '@/context/CartContext';
import Svg, { Path, Circle } from 'react-native-svg';

// --- Iconos ---
const FilterIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></Path></Svg>;
const SearchIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"></Path><Path d="M21 21l-4.35-4.35"></Path></Svg>;
const MinimalCartIcon = () => <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C8A2C8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Circle cx="9" cy="21" r="1"></Circle><Circle cx="20" cy="21" r="1"></Circle><Path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></Path></Svg>;
const SuccessIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></Path><Path d="M22 4L12 14.01l-3-3"></Path></Svg>;

// --- Componentes de UI Reutilizables ---

const CustomAlert = ({ visible, message, type, onHide }) => {
    const fadeAnim = useState(new Animated.Value(0))[0];
    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
            setTimeout(() => {
                Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onHide());
            }, 2500);
        }
    }, [visible]);
    if (!visible) return null;
    const backgroundColor = type === 'success' ? '#4CAF50' : '#F44336';
    return (<Animated.View style={[styles.alertContainer, { opacity: fadeAnim, backgroundColor }]}><SuccessIcon /><Text style={styles.alertText}>{message}</Text></Animated.View>);
};

const SearchBar = ({ searchQuery, setSearchQuery, onFilterPress }) => (
    <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}><SearchIcon /><TextInput style={styles.searchInput} placeholder="Buscar Álbumes, Light Sticks..." placeholderTextColor="#888" value={searchQuery} onChangeText={setSearchQuery} /></View>
        <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}><FilterIcon /></TouchableOpacity>
    </View>
);

const PromoBanner = () => (
    <View style={styles.bannerContainer}>
        <Image source={{ uri: 'https://via.placeholder.com/400x200/C3B1E1/FFFFFF?text=Nuevos+Lanzamientos' }} style={styles.bannerImage} />
        <View style={styles.bannerOverlay}><Text style={styles.bannerTitle}>Lo Nuevo en K-Pop</Text><Text style={styles.bannerSubtitle}>¡Descubre los últimos comebacks!</Text></View>
    </View>
);

const ProductCard = ({ item, onAddToCart }) => {
    const hasDiscount = item.originalPrice && item.originalPrice > item.price;
    
    const handlePress = (e) => {
        e.stopPropagation(); // Evita que el Link se active al presionar el botón
        onAddToCart(item._id);
    };

    return (
        <Link href={`/product/${item._id}`} asChild>
            <TouchableOpacity style={styles.productCard}>
                <Image source={{ uri: `https://res.cloudinary.com/dhwaeyuyp/image/upload/${item.imageUrl}` }} style={styles.productImage}/>
                {hasDiscount && (<View style={styles.discountBadge}><Text style={styles.discountText}>-{item.discountPercentage}%</Text></View>)}
                <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                    <View style={styles.footerContainer}>
                        <View style={styles.priceContainer}>
                            <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                            {hasDiscount && <Text style={styles.originalPrice}>${item.originalPrice.toFixed(2)}</Text>}
                        </View>
                        <TouchableOpacity style={styles.addToCartButton} onPress={handlePress}>
                            <MinimalCartIcon />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Link>
    );
};

// --- Pantalla Principal ---

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
  const [alert, setAlert] = useState({ visible: false, message: '', type: '' });

  const { fetchCart } = useCart();

  const showAlert = (message, type = 'success') => {
    setAlert({ visible: true, message, type });
  };

  const handleAddToCart = async (productId) => {
    try {
        await addItemToCart(productId, 1);
        showAlert('¡Agregado al carrito!');
        fetchCart(); // Actualiza el contador del carrito
    } catch (err) {
        showAlert('Error al agregar producto', 'error');
        console.error("Error al agregar al carrito:", err);
    }
  };

  const fetchProducts = useCallback(async (params, { isLoadMore = false }) => {
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
        fetchProducts({ page: 1, ...filters, search: searchQuery }, {});
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery, filters]);

  const handleLoadMore = () => {
    if (loadingMore || page >= totalPages) return;
    fetchProducts({ page: page + 1, ...filters, search: searchQuery }, { isLoadMore: true });
  };

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
  };
  
  const renderFilterModal = () => (
    <Modal visible={isFilterModalVisible} animationType="slide" transparent={true} onRequestClose={() => setFilterModalVisible(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filtros</Text>
          <ScrollView>
            <Text style={styles.filterSectionTitle}>Categoría</Text>
            <TouchableOpacity style={styles.filterOption} onPress={() => applyFilters({ ...filters, category: 'all' })}><Text>Todas las categorías</Text></TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity key={cat._id} style={styles.filterOption} onPress={() => applyFilters({ ...filters, category: cat.name })}><Text>{cat.name}</Text></TouchableOpacity>
            ))}
            <Text style={styles.filterSectionTitle}>Precio</Text>
            <TouchableOpacity style={styles.filterOption} onPress={() => applyFilters({ ...filters, price: '500' })}><Text>Hasta $500</Text></TouchableOpacity>
            <TouchableOpacity style={styles.filterOption} onPress={() => applyFilters({ ...filters, price: '1000' })}><Text>$501 a $1000</Text></TouchableOpacity>
            <TouchableOpacity style={styles.filterOption} onPress={() => applyFilters({ ...filters, price: 'more' })}><Text>Más de $1000</Text></TouchableOpacity>
            <TouchableOpacity style={styles.filterOption} onPress={() => applyFilters({ ...filters, price: 'all' })}><Text style={{fontWeight: 'bold'}}>Quitar filtro de precio</Text></TouchableOpacity>
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={() => setFilterModalVisible(false)}><Text style={styles.closeButtonText}>Cerrar</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderListHeader = () => (
    <>
      <PromoBanner />
      <Text style={styles.sectionTitle}>Explora Nuestros Productos</Text>
    </>
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
        <CustomAlert visible={alert.visible} message={alert.message} type={alert.type} onHide={() => setAlert({ ...alert, visible: false })} />
        {renderFilterModal()}
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} onFilterPress={() => setFilterModalVisible(true)} />
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <ProductCard item={item} onAddToCart={handleAddToCart} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={() => (<View style={styles.centered}><Text>No se encontraron productos.</Text></View>)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  searchInputWrapper: { flexDirection: 'row', flex: 1, backgroundColor: '#F5F5F5', borderRadius: 25, paddingHorizontal: 15, alignItems: 'center' },
  searchInput: { flex: 1, padding: 10, fontSize: 16, marginLeft: 10 },
  filterButton: { marginLeft: 15, padding: 5 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', margin: 15 },
  listContent: { paddingHorizontal: 10 },
  
  bannerContainer: { marginHorizontal: 5, marginTop: 15, borderRadius: 15, overflow: 'hidden', height: 180 },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  bannerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  bannerSubtitle: { color: 'white', fontSize: 16, marginTop: 5 },

  productCard: { flex: 1, margin: 5, backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0' },
  productImage: { width: '100%', height: 180, resizeMode: 'cover' },
  discountBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#FF6B6B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  discountText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  productInfo: { padding: 12 },
  productName: { fontSize: 14, fontWeight: '600', marginBottom: 5, height: 35 },
  footerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 },
  priceContainer: { flex: 1 },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  originalPrice: { fontSize: 12, color: '#999', textDecorationLine: 'line-through' },
  addToCartButton: { padding: 8, borderRadius: 20 },

  loadMoreButton: { margin: 15, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 8, alignItems: 'center' },
  loadMoreButtonText: { fontSize: 16, fontWeight: 'bold' },
  
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  filterSectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  filterOption: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  closeButton: { marginTop: 20, padding: 15, backgroundColor: '#3466f6', borderRadius: 8, alignItems: 'center' },
  closeButtonText: { color: 'white', fontWeight: 'bold' },
  
  alertContainer: { position: 'absolute', top: 50, left: 20, right: 20, padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', zIndex: 1000, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  alertText: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
});
