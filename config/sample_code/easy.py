def fibonacci(n):
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    else:
        a, b = 0, 1
        for _ in range(2, n):
            a, b = b, a + b
        return a

# exclude
assert fibonacci(2) == 1, "the function should return 1 but instead returned " + str(fibonacci(2))
assert fibonacci(3) == 2, "the function should return 2 but instead returned " + str(fibonacci(3))
assert fibonacci(10) == 55, "the function should return 55 but instead returned " + str(fibonacci(10))
assert fibonacci(12) == 144, "the function should return 144 but instead returned " + str(fibonacci(12))
print('success!')