#include <iostream>
#include <vector>
#include <string>

// Inventory management system with several intentional C++ issues

struct Product {
    int id;
    std::string name;
    double price;
    int* quantityRef;  // raw pointer — should be value or smart pointer
};

class Inventory {
public:
    Product** items;   // raw pointer array — should be std::vector<Product>
    int count;
    int capacity;

    Inventory(int cap) {
        capacity = cap;
        count = 0;
        items = new Product*[capacity];  // heap allocation, no RAII
    }

    void addProduct(int id, std::string name, double price, int qty) {
        Product* p = new Product();   // memory leak if addProduct throws
        p->id = id;
        p->name = name;
        p->price = price;
        p->quantityRef = new int(qty);  // nested heap allocation, no delete
        items[count++] = p;
    }

    Product* findById(int id) {
        for (int i = 0; i < count; i++) {
            if (items[i]->id == id) return items[i];
        }
        return nullptr;
    }

    void printAll() {
        for (int i = 0; i < count; i++) {
            printf("ID: %d  Name: %s  Price: %.2f  Qty: %d\n",
                items[i]->id,
                items[i]->name.c_str(),
                items[i]->price,
                *items[i]->quantityRef);
        }
    }

    double totalValue() {
        double* total = new double(0.0);  // completely unnecessary heap allocation
        for (int i = 0; i < count; i++) {
            *total += items[i]->price * (*items[i]->quantityRef);
        }
        double result = *total;
        // missing: delete total  <-- memory leak
        return result;
    }

    // destructor missing — ~Inventory() never defined
};

void processOrder(Inventory* inv, int productId, int requestedQty) {
    Product* p = inv->findById(productId);
    if (p == nullptr) {
        std::cout << "Product not found." << std::endl;
        return;
    }

    // no bounds check on requestedQty — could go negative
    *p->quantityRef -= requestedQty;

    if (*p->quantityRef < 0) {
        std::cout << "WARNING: quantity went negative for " << p->name << std::endl;
    }
}

int main() {
    Inventory* inv = new Inventory(100);  // heap-allocated, never deleted

    inv->addProduct(1, "Widget A", 9.99, 50);
    inv->addProduct(2, "Gadget B", 24.99, 30);
    inv->addProduct(3, "Doohickey C", 4.49, 200);

    std::cout << "=== Current Inventory ===" << std::endl;
    inv->printAll();

    std::cout << "\nTotal inventory value: $" << inv->totalValue() << std::endl;

    processOrder(inv, 2, 5);
    processOrder(inv, 99, 1);   // nonexistent product

    std::cout << "\n=== After Orders ===" << std::endl;
    inv->printAll();

    // missing: delete inv  <-- memory leak
    return 0;
}
