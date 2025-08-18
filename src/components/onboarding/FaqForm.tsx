import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, GripVertical } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqFormProps {
  data: FaqItem[];
  onChange: (data: FaqItem[]) => void;
}

export function FaqForm({ data, onChange }: FaqFormProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addFaq = () => {
    const newFaq = { question: "", answer: "" };
    onChange([...data, newFaq]);
    setEditingIndex(data.length);
  };

  const updateFaq = (index: number, field: keyof FaqItem, value: string) => {
    const updated = data.map((faq, i) => 
      i === index ? { ...faq, [field]: value } : faq
    );
    onChange(updated);
  };

  const removeFaq = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const moveFaq = (fromIndex: number, toIndex: number) => {
    const newData = [...data];
    const [movedItem] = newData.splice(fromIndex, 1);
    newData.splice(toIndex, 0, movedItem);
    onChange(newData);
  };

  const commonQuestions = [
    "What are your hours of operation?",
    "Do you offer delivery?",
    "Do you accept reservations?",
    "What payment methods do you accept?",
    "Do you have vegetarian/vegan options?",
    "Is parking available?",
    "Do you cater events?",
    "Are you family-friendly?",
    "Do you have a happy hour?",
    "What is your cancellation policy?"
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Frequently Asked Questions</h3>
        <p className="text-muted-foreground">
          Add common questions and answers to help your customers quickly find the information they need.
        </p>
      </div>

      {data.length === 0 && (
        <Card className="p-6 border-dashed">
          <div className="text-center">
            <h4 className="text-base font-medium mb-2">No FAQs yet</h4>
            <p className="text-muted-foreground mb-4">
              Start by adding your first frequently asked question.
            </p>
            <Button onClick={addFaq} className="mb-4">
              <Plus className="w-4 h-4 mr-2" />
              Add First FAQ
            </Button>
            
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium mb-3">Common restaurant questions:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                {commonQuestions.map((question, index) => (
                  <div key={index} className="text-left">• {question}</div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {data.map((faq, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-start gap-4">
            <div className="mt-2 cursor-move text-muted-foreground">
              <GripVertical className="w-4 h-4" />
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <Label className="text-sm font-medium">Question {index + 1}</Label>
                <Input
                  placeholder="Enter your question"
                  value={faq.question}
                  onChange={(e) => updateFaq(index, 'question', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Answer</Label>
                <Textarea
                  placeholder="Enter the answer to this question"
                  value={faq.answer}
                  onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>

              {faq.question && faq.answer && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Preview:</p>
                  <div className="space-y-2">
                    <p className="font-medium text-sm">{faq.question}</p>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => removeFaq(index)}
              className="mt-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}

      <div className="flex justify-center">
        <Button onClick={addFaq} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Another FAQ
        </Button>
      </div>

      {data.length > 0 && (
        <Card className="p-4 bg-accent/50">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Good FAQs answer the questions your customers ask most often. 
            Keep answers clear and concise, and consider including your contact information 
            for questions not covered here.
          </p>
        </Card>
      )}
    </div>
  );
}