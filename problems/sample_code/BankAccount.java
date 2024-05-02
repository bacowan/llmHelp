package problems.sample_code;

public class BankAccount {

    private int balance;
    private final Object lock = new Object();

    public BankAccount(int balance) {
        this.balance = balance;
    }

    public int getBalance() {
        try {
            int ret = this.balance;
            // simulate network delay
            Thread.sleep(1000);
            return ret;
        }
        catch (InterruptedException e) {
            return this.balance;
        }
    }

    public void setBalance(int val) {
        this.balance = val;
    }

    public static void transferFunds(BankAccount accountFrom, BankAccount accountTo, int amount) {
        int currentBalanceFrom = 0;
        int currentBalanceTo = 0;
        synchronized (accountFrom.lock) {
            currentBalanceFrom = accountFrom.getBalance();
            synchronized (accountTo.lock) {
                currentBalanceTo = accountTo.getBalance();
            }
        }
        accountFrom.setBalance(currentBalanceFrom - amount);
        accountTo.setBalance(currentBalanceTo + amount);
    }
    

    // exclude_start
    public static void main(String[] args) throws InterruptedException {
        BankAccount account1 = new BankAccount(1000);
        BankAccount account2 = new BankAccount(1500);
        Thread thread1 = new Thread(new Runnable() {
            @Override
            public void run() {
                BankAccount.transferFunds(account1, account2, 200);
            }
        });
        Thread thread2 = new Thread(new Runnable() {
            @Override
            public void run() {
                BankAccount.transferFunds(account2, account1, 300);
            }
        });
        thread1.start();
        thread2.start();
        thread1.join();
        thread2.join();
        assert account1.balance == 1100 : "the balance of account1 was supposed to be 1100 but was instead " + account1.balance;
        assert account2.balance == 1400 : "the balance of account2 was supposed to be 1400 but was instead " + account2.balance;
        System.out.println("success!");
    }
    // exclude_stop
}