import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddCardModal } from "../card-management/add-card-modal";
import { useStreamContext } from "@/providers/Stream";
import { encryptCardData } from "@/lib/card-encryption";
import type { CardFormData } from "@/lib/validations/card";
import { CreditCard } from "lucide-react";
import { getLastFourDigits, detectCardBrand } from "@/lib/utils/card-utils";
import { toast } from "sonner";

interface CardData {
  lastFourDigits: string;
  cardholderName: string;
  cardBrand: string;
  expiryDate: string;
  status: "active" | "in_progress";
}

const CARD_STORAGE_KEY = "visa-card-data";

/**
 * Card data prompt component shown when the graph interrupts waiting for card data.
 * Displays a message asking the user to add their card and provides a button to open the modal.
 */
export function CardDataPrompt() {
  const stream = useStreamContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardAdded = async (fullCardData: CardFormData) => {
    // Encrypt the raw card data client-side; cleartext PAN/CVV is never
    // persisted and never sent over the stream.
    let encryptedCardData: string;
    try {
      encryptedCardData = await encryptCardData(fullCardData);
    } catch (error) {
      console.error("Failed to encrypt card data:", error);
      toast.error("Could not securely process the card. Please try again.");
      return;
    }

    // Transform to display format (same as CardSection does)
    const displayData: CardData = {
      lastFourDigits: getLastFourDigits(fullCardData.cardNumber),
      cardholderName: fullCardData.cardholderName,
      cardBrand: detectCardBrand(fullCardData.cardNumber),
      expiryDate: fullCardData.expiryDate,
      status: "in_progress",
    };

    // Save only non-sensitive display data to localStorage (so it appears in
    // settings). No PAN/CVV is stored.
    try {
      localStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(displayData));
    } catch (error) {
      console.error("Failed to save card display data:", error);
    }

    // Resume the graph with the encrypted card payload and email.
    stream.submit(
      {
        private_encryptedCardData: encryptedCardData,
        email: fullCardData.email,
      } as any,
      {
        streamMode: ["values"],
        config: {
          configurable: {
            model: stream.currentModel,
          },
        },
      },
    );

    setIsModalOpen(false);
  };

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CreditCard className="w-5 h-5 text-[var(--visa-blue-primary)]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--visa-blue-primary)] mb-1">
              Card Information Required
            </p>
            <p className="text-sm text-gray-700">
              To continue, enter your Visa card data info
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="brand"
          className="w-full sm:w-auto"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Add Card
        </Button>
      </div>

      <AddCardModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCardAdded={handleCardAdded}
      />
    </>
  );
}
