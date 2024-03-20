import pandas as pd
import random

data = pd.read_csv("data.csv")

id=['738781', '738751', '738764']

for i in range(len(data)):
    mask = random.randint(0, 7)
    for j in range(3):
        if (mask >> j & 1) == 1:
            print(f"('{data.iloc[i, 1]}', '{id[j]}'),")