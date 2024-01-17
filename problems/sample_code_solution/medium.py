def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1

        while j >= 0 and key < arr[j]:
            arr[j + 1] = arr[j]
            j -= 1

        arr[j + 1] = key
    return arr

# exclude
assert insertion_sort([12, 11, 13, 5, 6]) == [5, 6, 11, 12, 13], "the function should return [5, 6, 11, 12, 13] but instead returned " + str(insertion_sort([12, 11, 13, 5, 6]))
assert insertion_sort([1, 2, 3]) == [1, 2, 3], "the function should return [1, 2, 3] but instead returned " + str(insertion_sort([1, 2, 3]))
assert insertion_sort([5, -1, 0, -3]) == [-3, -1, 0, 5], "the function should return [-3, -1, 0, 5] but instead returned " + str(insertion_sort([5, -1, 0, -3]))
assert insertion_sort([1]) == [1], "the function should return [1] but instead returned " + str(insertion_sort([1]))
print('success!')