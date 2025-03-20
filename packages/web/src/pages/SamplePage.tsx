import React, { useState, useCallback, useEffect } from 'react';
import {
  ExperimentVariant,
  useExperiment,
  useExperimentEvent
} from '@sofi-application/ui-components';
import { ExperimentSelector } from '../components/ExperimentSelector';
import { ExperimentApiClient, Experiment } from '@sofi-application/shared';
import styles from './SamplePage.module.css';

// Get the API URL from environment variables with a localhost default
const API_URL = process.env.VITE_EXPERIMENTATION_API_URL || process.env.REACT_APP_EXPERIMENTATION_API_URL || 'http://localhost:3000';

export function SamplePage() {
  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'Premium Headphones', price: 199.99, quantity: 1 },
    { id: 2, name: 'Wireless Keyboard', price: 89.99, quantity: 1 },
  ]);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);
  const [availableExperiments, setAvailableExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // For demo purposes, we'll use a fixed user ID and session ID
  const userId = 'user-123';
  const sessionId = 'session-456';
  
  // Use the experiment hook to get experiment data for the current user
  const { experiments } = useExperiment(userId, sessionId);
  
  // Use the experiment event hook to record events
  const { recordEvent } = useExperimentEvent(userId, sessionId);
  
  // Fetch all active experiments for the selector
  useEffect(() => {
    const fetchExperiments = async () => {
      try {
        setLoading(true);
        const apiClient = new ExperimentApiClient(API_URL);
        const response = await apiClient.listExperiments({ status: 'ACTIVE' });
        setAvailableExperiments(response.experiments);
      } catch (err) {
        console.error('Error fetching experiments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExperiments();
  }, []);
  
  // Calculate the total price
  const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Handle experiment selection
  const handleSelectExperiment = useCallback((experimentId: string) => {
    setSelectedExperimentId(experimentId);
  }, []);
  
  // Handle checkout button click
  const handleCheckout = (experimentId: string, variantId: string) => {
    // Record the checkout event
    recordEvent(experimentId, variantId, 'CHECKOUT_CLICK', {
      cartTotal: totalPrice,
      itemCount: cartItems.length,
    });
    
    // Simulate a successful checkout
    setCheckoutComplete(true);
  };
  
  // Find the selected experiment from available experiments
  const selectedExperiment = availableExperiments.find(exp => exp.id === selectedExperimentId);
  
  // Find the assigned variant for the selected experiment
  const assignedVariant = experiments.find(exp => exp.experimentId === selectedExperimentId);
  
  // Get the button color from the experiment or use a default
  const getButtonColor = () => {
    if (selectedExperiment && assignedVariant && assignedVariant.config.buttonColor) {
      return assignedVariant.config.buttonColor;
    }
    return '#3498db'; // Default blue
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Sample Checkout Page</h1>
      <p className={styles.description}>
        This page demonstrates how experiments can be applied to a checkout flow.
        Select an experiment below to see it in action.
      </p>
      
      <ExperimentSelector
        onSelectExperiment={handleSelectExperiment}
        selectedExperimentId={selectedExperimentId}
      />
      
      {checkoutComplete ? (
        <div className={styles.successMessage}>
          <h2>Thank you for your order!</h2>
          <p>Your order has been placed successfully.</p>
          <button 
            className={styles.continueButton}
            onClick={() => setCheckoutComplete(false)}
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className={styles.checkoutContainer}>
          <div className={styles.cartSection}>
            <h2>Your Cart</h2>
            <div className={styles.cartItems}>
              {cartItems.map(item => (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.itemDetails}>
                    <h3>{item.name}</h3>
                    <p className={styles.itemPrice}>${item.price.toFixed(2)}</p>
                  </div>
                  <div className={styles.itemQuantity}>
                    <button 
                      className={styles.quantityButton}
                      onClick={() => {
                        setCartItems(prevItems =>
                          prevItems.map(prevItem =>
                            prevItem.id === item.id && prevItem.quantity > 1
                              ? { ...prevItem, quantity: prevItem.quantity - 1 }
                              : prevItem
                          )
                        );
                      }}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      className={styles.quantityButton}
                      onClick={() => {
                        setCartItems(prevItems =>
                          prevItems.map(prevItem =>
                            prevItem.id === item.id
                              ? { ...prevItem, quantity: prevItem.quantity + 1 }
                              : prevItem
                          )
                        );
                      }}
                    >
                      +
                    </button>
                  </div>
                  <div className={styles.itemTotal}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className={styles.cartSummary}>
              <div className={styles.summaryRow}>
                <span>Subtotal:</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping:</span>
                <span>FREE</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Tax:</span>
                <span>${(totalPrice * 0.08).toFixed(2)}</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>Total:</span>
                <span>${(totalPrice * 1.08).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className={styles.checkoutSection}>
            <h2>Payment Information</h2>
            <div className={styles.formGroup}>
              <label htmlFor="cardName">Name on Card</label>
              <input type="text" id="cardName" placeholder="John Smith" />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="cardNumber">Card Number</label>
              <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="expDate">Expiration Date</label>
                <input type="text" id="expDate" placeholder="MM/YY" />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="cvv">CVV</label>
                <input type="text" id="cvv" placeholder="123" />
              </div>
            </div>
            
            {/* Experiment Variant */}
            {selectedExperimentId ? (
              <ExperimentVariant
                experimentId={selectedExperimentId}
                userId={userId}
                sessionId={sessionId}
                variants={{
                  // Dynamically generate variants based on the selected experiment
                  ...(selectedExperiment?.variants || []).reduce((acc: Record<string, React.ReactNode>, variant) => ({
                    ...acc,
                    [variant.id]: (
                      <button
                        className={styles.checkoutButton}
                        style={{
                          backgroundColor: variant.config.buttonColor || '#3498db'
                        }}
                        onClick={() => handleCheckout(selectedExperimentId, variant.id)}
                      >
                        Complete Checkout
                      </button>
                    )
                  }), {})
                }}
                fallback={
                  <button
                    className={styles.checkoutButton}
                    style={{ backgroundColor: getButtonColor() }}
                    onClick={() => {
                      if (assignedVariant) {
                        handleCheckout(
                          selectedExperimentId,
                          assignedVariant.variantId
                        );
                      } else {
                        setCheckoutComplete(true);
                      }
                    }}
                  >
                    Complete Checkout
                  </button>
                }
              />
            ) : (
              <button
                className={styles.checkoutButton}
                style={{ backgroundColor: '#3498db' }}
                onClick={() => setCheckoutComplete(true)}
                disabled={!selectedExperimentId}
              >
                Complete Checkout
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className={styles.experimentInfo}>
        <h3>About This Experiment</h3>
        <p>
          This page demonstrates an A/B test for the checkout button color. Different users will see different button colors,
          and we track which color leads to more conversions.
        </p>
        <p>
          Current experiment status:
          {assignedVariant ? (
            <span className={styles.experimentActive}>
              Active - You're seeing variant: {assignedVariant.variantId}
            </span>
          ) : (
            <span className={styles.experimentInactive}>
              {selectedExperimentId ? 'Waiting for assignment...' : 'No experiment selected'}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}