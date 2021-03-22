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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  async function verifyStock(productId: number) {
    const { 
      amount 
    } = await api.get(`stock/${productId}`)      
          .then(response => response.data);   

    return amount;
  }

  const addProduct = async (productId: number) => {
    try {
      const productExist = cart.findIndex(cardList => cardList.id === productId);
      
      const stockProduct = await verifyStock(productId);    
    
      if (productExist !== -1) {        
        if (stockProduct - cart[productExist].amount >= 1) {
          const newCart = cart.map(cartMap => {
            if (cartMap.id === productId) {
              cartMap.amount += 1;
            }
            return cartMap;
          });

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));  
          setCart(newCart);         
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }  
      } else {                
        if (stockProduct >= 1) {
          const { 
            id, 
            image,
            price, 
            title, 
          } = await api.get(`products/${productId}`)      
                .then(response => response.data);

          const newCart = {
            id, 
            image,
            price, 
            title, 
            amount: 1,
          };

          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, newCart])); 
          setCart([...cart, newCart]);          
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }                  
      }                 
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.findIndex(cartProd => cartProd.id === productId);

      if (productExists === -1) {
        toast.error('Erro na remoção do produto');  
      } else {
        const newCart = cart;
        newCart.splice(productExists, 1);
        
        setCart(newCart); 
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount > 0) {
        const stockProduct = await verifyStock(productId);   

        if (stockProduct >= amount) {
          const updatedCart = cart.map(prod => {
            if (prod.id === productId) {
              prod.amount = amount;
            }

            return prod;
          });  

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
          setCart(updatedCart);
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }        
      }
    } catch {
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
