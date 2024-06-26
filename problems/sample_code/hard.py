import threading
import time

class BankAccount:
    def __init__(self, balance):
        self.balance = balance
        self.lock = threading.Lock()
    
    def get_balance(self):
        ret = self.balance
        # simulate network delay
        time.sleep(1)
        return ret
    
    def set_balance(self, val):
        self.balance = val

def transfer_funds(account_from, account_to, amount):
    with account_from.lock:
        current_balance_from = account_from.get_balance()
        with account_to.lock:
            current_balance_to = account_to.get_balance()

    account_from.balance = current_balance_from - amount
    account_to.balance = current_balance_to + amount

# exclude_start
account1 = BankAccount(1000)
account2 = BankAccount(1500)
thread1 = threading.Thread(target=transfer_funds, args=(account1, account2, 200))
thread2 = threading.Thread(target=transfer_funds, args=(account2, account1, 300))
thread1.start()
thread2.start()
thread1.join(1)
thread2.join(1)
assert account1.balance == 1100, "the balance of account1 was supposed to be 1100 but was instead " + str(account1.balance)
assert account2.balance == 1400, "the balance of account2 was supposed to be 1400 but was instead " + str(account2.balance)
print('success!')
# exclude_stop