def maxInList(l):
    maxVal = None
    for x in l:
        if maxVal == None or maxVal < x:
            maxVal = x
    return maxVal

# exclude
assert maxInList([1, 2, 3, 4, 5]) == 5, "the function should return 5 but instead returned " + str(maxInList([1, 2, 3, 4, 5]))
assert maxInList([-1, -2, -3, -4, -5]) == -1, "the function should return -1 but instead returned " + str(maxInList([-1, -2, -3, -4, -5]))
assert maxInList([-1, 19, 6, 19, 6, 6]) == 19, "the function should return 19 but instead returned " + str(maxInList([-1, 19, 6, 19, 6, 6]))
assert maxInList([5]) == 5, "the function should return 5 but instead returned " + str(maxInList([5]))
print('success!')