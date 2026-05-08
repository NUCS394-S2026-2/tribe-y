#include <iostream>
#include <memory>
#include <vector>
#include <string>
#include <algorithm>

class Employee {
public:
    Employee(std::string name, double salary)
        : name_(std::move(name)), salary_(salary) {}

    const std::string& name() const { return name_; }
    double salary() const { return salary_; }

    void raise(double percent) {
        salary_ *= (1.0 + percent / 100.0);
    }

private:
    std::string name_;
    double salary_;
};

class Department {
public:
    void addEmployee(std::unique_ptr<Employee> emp) {
        employees_.push_back(std::move(emp));
    }

    double totalPayroll() const {
        double total = 0.0;
        for (const auto& emp : employees_) {
            total += emp->salary();
        }
        return total;
    }

    void printRoster() const {
        for (const auto& emp : employees_) {
            std::cout << emp->name() << ": $" << emp->salary() << "\n";
        }
    }

    size_t size() const { return employees_.size(); }

private:
    std::vector<std::unique_ptr<Employee>> employees_;
};

int main() {
    Department eng;
    eng.addEmployee(std::make_unique<Employee>("Alice", 95000.0));
    eng.addEmployee(std::make_unique<Employee>("Bob", 88000.0));
    eng.addEmployee(std::make_unique<Employee>("Carol", 102000.0));

    eng.printRoster();
    std::cout << "Total payroll: $" << eng.totalPayroll() << "\n";
    std::cout << "Headcount: " << eng.size() << "\n";

    return 0;
}
