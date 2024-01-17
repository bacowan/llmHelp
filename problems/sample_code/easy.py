def max_in_list(l):
    max_val = 0
    for x in range(l):
        if max_val < x:
            max_val = x
    return max_val

# exclude
assert max_in_list([1, 2, 3, 4, 5]) == 5, "the function should return 5 but instead returned " + str(max_in_list([1, 2, 3, 4, 5]))
assert max_in_list([-1, -2, -3, -4, -5]) == -1, "the function should return -1 but instead returned " + str(max_in_list([-1, -2, -3, -4, -5]))
assert max_in_list([-1, 19, 6, 19, 6, 6]) == 19, "the function should return 19 but instead returned " + str(max_in_list([-1, 19, 6, 19, 6, 6]))
assert max_in_list([5]) == 5, "the function should return 5 but instead returned " + str(max_in_list([5]))
print('success!')