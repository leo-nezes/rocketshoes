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
      const stock = await api.get<Stock>(`/stock/${productId}`);
      const responseProduct = await api.get<Product>(`/products/${productId}`);
      
      const productAlreadyExistsInCart = cart.find(product => product.id === productId);

      if(productAlreadyExistsInCart) {
        if(!(productAlreadyExistsInCart.amount < stock.data.amount)) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        
        // O amount enviado como parâmetro é o possível valor que será atualizado e não a quantidade atual.
        await updateProductAmount({ productId, amount: ++productAlreadyExistsInCart.amount });
      } else {
        const newProduct = { ...responseProduct.data, amount: 1 };

        setCart([...cart, newProduct]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, newProduct]));
      }
    } catch(error) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const product = cart.find(item => item.id === productId);

      if(!product) throw new Error();

      const newCart = cart.filter(item => item.id !== productId);

      setCart([ ...newCart ]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify([ ...newCart ]));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const responseProduct = await api.get<Product>(`/products/${productId}`);

      if(!responseProduct.data) throw new Error();

      const newCart = cart.map(product => {
        if(product.id === productId) {
          const updatedProduct = {
            ...product,
            amount,
          }
          
          return updatedProduct;
        }

        return product;
      });

      setCart([...newCart]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...newCart]));
    } catch(error) {
      toast.error('Erro na alteração de quantidade do produto');
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
