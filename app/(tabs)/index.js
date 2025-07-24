import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TextInput, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { getAllProducts } from '@/api/productService'; // Importamos la función de la API

export default function HomeScreen() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true); // Para la carga inicial
  const [loadingMore, setLoadingMore] = useState(false); // Para el botón "Cargar más"
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async (currentPage) => {
    try {
      // Pasamos el número de página a la función de la API.
      const response = await getAllProducts(currentPage);
      
      const productsData = Array.isArray(response.data.products) ? response.data.products : [];
      
      // Si es la primera página, reemplazamos los productos.
      // Si no, los añadimos a la lista existente.
      setProducts(prevProducts => currentPage === 1 ? productsData : [...prevProducts, ...productsData]);
      setTotalPages(response.data.totalPages);

    } catch (err) {
      console.error("Error al obtener productos:", err);
      setError("No se pudieron cargar los productos.");
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchProducts(1).finally(() => setLoading(false));
  }, []);

  const handleLoadMore = () => {
    // No hacer nada si ya estamos cargando o si ya hemos cargado todas las páginas
    if (loadingMore || page >= totalPages) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    fetchProducts(nextPage).finally(() => {
      setPage(nextPage);
      setLoadingMore(false);
    });
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery) {
      return products;
    }
    return products.filter(product =>
      product.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const renderFooter = () => {
    if (loadingMore) {
      return <ActivityIndicator style={{ marginVertical: 20 }} size="large" />;
    }
    // Mostramos el botón solo si hay más páginas por cargar
    if (page < totalPages) {
      return (
        <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
          <Text style={styles.loadMoreButtonText}>Cargar más productos</Text>
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
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar en K-Store..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.productCard}>
              <Image source={{ uri: item.imagenes_urls[0] }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.nombre}</Text>
                <Text style={styles.productPrice}>${item.precio.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
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
  searchContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  listContent: {
    padding: 5,
  },
  productCard: {
    flex: 1,
    margin: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  productImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#333333',
  },
  loadMoreButton: {
    margin: 15,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  loadMoreButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
