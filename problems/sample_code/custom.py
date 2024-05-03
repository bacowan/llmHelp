list1 = [1, 2, 5, 6]
 
# using list comprehension to iterate each
# values in list and create a tuple as specified
res = [(val, val * 3) for val in list1]
 
# print the result
print(res)