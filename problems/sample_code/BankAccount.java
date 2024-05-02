package problems.sample_code;

public class BankAccount {

    private int balance;
    private final Object lock = new Object();

    public BankAccount(int balance) {
        this.balance = balance;
    }

    public int GetBalance() throws InterruptedException {
        int ret = this.balance;
        // simulate network delay
        Thread.sleep(1000);
        return ret;
    }

    public void SetBalance(int val) {
        this.balance = val;
    }

    public static void TransferFunds(BankAccount accountFrom, BankAccount accountTo, int amount) {
        try {
            int currentBalanceFrom = 0;
            int currentBalanceTo = 0;
            synchronized (accountFrom.lock) {
                currentBalanceFrom = accountFrom.GetBalance();
                synchronized (accountTo.lock) {
                    currentBalanceTo = accountTo.GetBalance();
                }
            }
            accountFrom.SetBalance(currentBalanceFrom - amount);
            accountTo.SetBalance(currentBalanceTo + amount);
        }
        catch (InterruptedException e) {
            System.out.println("error: interrupted");
        }
    }
    

    // exclude_start
    public static void main(String[] args) throws InterruptedException {
        BankAccount account1 = new BankAccount(1000);
        BankAccount account2 = new BankAccount(1500);
        Thread thread1 = new Thread(new Runnable() {
            @Override
            public void run() {
                BankAccount.TransferFunds(account1, account2, 200);
            }
        });
        Thread thread2 = new Thread(new Runnable() {
            @Override
            public void run() {
                BankAccount.TransferFunds(account2, account1, 300);
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