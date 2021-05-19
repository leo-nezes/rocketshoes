import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const responseProduct = await api.get<Product>(`/products/${productId}`);

      if(!responseProduct.data) throw new Error('Erro na adição do produto');

      const productAlreadyExistsInCart = cart.find(product => product.id === productId);

      if(productAlreadyExistsInCart) {
        updateProductAmount({ productId, amount: productAlreadyExistsInCart.amount });
      } else {
        const newProduct = { ...responseProduct.data, amount: 1 };

        setCart([...cart, newProduct]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, newProduct]));
      }

    } catch(error) {
      toast.error(error);
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock = await api.get<Stock>(`/stock/${productId}`);

      if(!(amount < stock.data.amount)) throw new Error('Quantidade solicitada fora de estoque');
      
      const newCart = cart.map(product => {
        if(product.id === productId) {
          const updatedProduct = {
            ...product,
            amount: amount++,
          }
          
          return updatedProduct;
        }

        return product;
      });

      setCart([...newCart]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...newCart]));
    } catch(error) {
      toast.error(error);
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
