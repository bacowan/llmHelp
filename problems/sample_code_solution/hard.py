import threading
import time

class BankAccount:
    def __init__(self, balance):
        self.balance = balance
    
    def get_balance(self):
        ret = self.balance
        # simulate network delay
        time.sleep(1)
        return ret
    
    def set_balance(self, val):
        self.balance = val

lock = threading.Lock()
def transfer_funds(account_from, account_to, amount):
    with lock:
        account_from.balance = account_from.get_balance() - amount
        account_to.balance = account_to.balance.get_balance() + amount

# exclude
account1 = BankAccount(1000)
account2 = BankAccount(1500)
thread1 = threading.Thread(target=transfer_funds, args=(account1, account2, 200))
thread2 = threading.Thread(target=transfer_funds, args=(account2, account1, 300))
thread1.start()
thread2.start()
thread1.join()
thread2.join()
assert account1.balance == 1100, "the balance of account1 was supposed to be 1100 but was instead " + str(account1.balance)
assert account2.balance == 1400, "the balance of account2 was supposed to be 1400 but was instead " + str(account2.balance)
print('success!')