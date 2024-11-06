ví dụ có 1k user => tìm thằng 800 -> find bình thường thì vẫn tìm hết collection của mình => lâu

đánh index cho bảng

thấy trường `name` hay tìm => đánh index cho trường `name` => tìm kiếm nhanh hơn

# compound index

index nhiều trường

ví dụ muốn tìm ng đàn ông + độ tuổi là 20 => đánh index cho 2 trường sex và age (ví dụ lúc đầu đánh index cho 1 trường là sex thì duyệt qua 9 bản ghi, khi đánh 2 index vẫn duyệt qua 9 bản ghi nhưng nó chỉ return ra 4 bản ghi đúng điều kiện)

khi index theo cái sex thì ví dụ duyệt sex là nam thì duyệt 500 bản ghi(1 nửa, do 1 nửa là nam) => duyệt 500 bản ghi để tìm đúng điều kiện
khi index cái age thì ví dụ duyệt độ tuổi là 20 thì duyệt 100 bản ghi có age là 20 trong db => duyệt 100 bản ghi để tìm đúng điều kiện

=> khi đó thì đánh index 2 trường age và sex thì sẽ duyệt 100 bản ghi để tìm đúng điều kiện => ưu tiên đánh index age là lợi nhất

=> có 1 cái đánh index `compound index` (sex_1_age_1) (sex là tên trường, 1 là asc, -1 là desc => lúc tạo trên ui của cái mongo compass nó có) => create index => chèn cái sex vào => ấn vào dấu + => nhập cái age => ra cái index kia => chỉ duyệt qua 4 bản ghi (là 4 bản ghi đúng điều kiện)

# Index sắp xếp tăng dần và giảm dần

1 là asc, -1 là desc khi `compound index`

# index text

câu query trên ui `{$text: {$search: "abc"}}`
=> qua index thêm 1 cái index vào field là trường muốn tìm (ví dụ muốn tìm address có chữ abc thì field là address) => cái ô thứ 2 là `text`

1 collection chỉ được 1 cái index text thôi nếu muốn 2 cái address và name cùng 1 lúc thì khai báo tương tự compound index

tìm chính xác `{$text: {$search: "\"abc"\"}}`

````ts
db.users.createIndex({"address": "text", "name": -1})
db.users.dropIndex('name\_-1')```
````

bên `database.serveic.ts` => viết thêm hàm

```ts
indexUsers() {
    this.users.createIndex({ email: 1, password: 1 })
    this.users.createIndex({ email: 1 }, { unique: true })
    this.users.createIndex({ username: 1 }, { unique: true })
  }
```

bên file `index.ts` => viết thêm hàm

```ts
databaseService.connect().then(() => {
  databaseService.indexUsers()
})
```
