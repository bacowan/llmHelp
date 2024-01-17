import threading
import time

# Shared counter without proper synchronization
counter = 0

# Number of increments for each thread
increments_per_thread = 10000

def increment_counter():
    global counter
    for _ in range(increments_per_thread):
        current_value = counter
        # Introduce a small delay to increase the chance of race condition
        time.sleep(0.000001)
        counter = current_value + 1

def main():
    # Race condition scenario: Multiple threads incrementing the shared counter concurrently
    thread1 = threading.Thread(target=increment_counter, name="Thread-1")
    thread2 = threading.Thread(target=increment_counter, name="Thread-2")

    thread1.start()
    thread2.start()

    thread1.join()
    thread2.join()

    print("Final counter value:", counter)

if __name__ == "__main__":
    main()
