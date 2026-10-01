// Create an instance of Notyf
var notyf = new Notyf({
  duration: 3000,
  position: {
    x:'right',
    y:'top'
  },
  dismissible: true
});

const notifyData = sessionStorage.getItem("notify");
if(notifyData) {
  const { type, message } = JSON.parse(notifyData);
  if(type == "error") {
    notyf.error(message);
  } else if(type == "success") {
    notyf.success(message);
  }
  sessionStorage.removeItem("notify");
}

const drawNotify = (type, message) => {
  sessionStorage.setItem("notify", JSON.stringify({
    type: type,
    message: message
  }));
}

// ===== Loading / lỗi dùng chung =====
// Gọi API trả JSON. Lỗi mạng hoặc phản hồi không phải JSON (server sập, 502...) đều ném ra Error có thông báo dễ hiểu
const requestJson = async (url, options = {}) => {
  let res;
  try {
    res = await fetch(url, options);
  } catch (error) {
    throw new Error("Không kết nối được máy chủ, vui lòng kiểm tra mạng và thử lại!");
  }
  try {
    return await res.json();
  } catch (error) {
    throw new Error("Máy chủ đang gặp sự cố, vui lòng thử lại sau!");
  }
}

const jsonOptions = (method, data) => ({
  method: method,
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(data)
});

// Nút đang chờ request: khóa nút + hiện vòng xoay để người dùng không bấm lặp
const setButtonLoading = (button, isLoading, text = "Đang xử lý...") => {
  if(!button) return;
  if(isLoading) {
    if(button.hasAttribute("data-loading")) return;
    button.setAttribute("data-loading", button.innerHTML);
    button.setAttribute("aria-busy", "true");
    button.disabled = true;
    button.classList.add("is-loading");
    button.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span>${text}`;
  } else {
    if(!button.hasAttribute("data-loading")) return;
    button.innerHTML = button.getAttribute("data-loading");
    button.removeAttribute("data-loading");
    button.removeAttribute("aria-busy");
    button.disabled = false;
    button.classList.remove("is-loading");
  }
}

const isButtonLoading = (button) => button ? button.hasAttribute("data-loading") : false;

// Nút submit của form (JustValidate gọi onSuccess với event submit)
const getSubmitButton = (form) => form.querySelector(`button[type="submit"], button:not([type])`);

// Gửi request gắn với một nút: khóa nút trong lúc chờ, báo lỗi nếu request hỏng.
// onData trả về true khi sắp chuyển trang -> giữ nút ở trạng thái khóa để không bấm thêm lần nữa
const sendWithButton = (button, url, options, onData, loadingText) => {
  if(isButtonLoading(button)) return;
  setButtonLoading(button, true, loadingText);
  requestJson(url, options)
    .then(data => {
      if(onData(data) !== true) {
        setButtonLoading(button, false);
      }
    })
    .catch(error => {
      setButtonLoading(button, false);
      notyf.error(error.message);
    });
}

// Khối trạng thái chèn vào những vùng nội dung được vẽ bằng JS
const htmlLoading = (text = "Đang tải...") => `
  <div class="state-box state-loading" role="status">
    <span class="state-spinner" aria-hidden="true"></span>
    <span>${text}</span>
  </div>
`;

const htmlError = (text) => `
  <div class="state-box state-error" role="alert">
    <i class="far fa-exclamation-circle" aria-hidden="true"></i>
    <span>${text}</span>
    <button class="state-retry" type="button" button-retry>Thử lại</button>
  </div>
`;

const htmlEmpty = (text) => `<div class="state-box state-empty">${text}</div>`;

// Bọc khối trạng thái thành một dòng của bảng
const htmlTableRow = (html, colspan) => `<tr><td colspan="${colspan}">${html}</td></tr>`;

// Gắn sự kiện cho nút "Thử lại" trong khối lỗi
const bindRetry = (container, handler) => {
  if(!container) return;
  container.querySelectorAll("[button-retry]").forEach(button => {
    button.addEventListener("click", handler);
  });
}
// ===== Hết Loading / lỗi dùng chung =====

// pagination
const pagination = document.querySelector(".pagination");
if(pagination) {
  const url = new URL(window.location.href);

  const listItem = pagination.querySelectorAll(".page-item [page]");
  listItem.forEach(item => {
    item.addEventListener("click", () => {
      const value = item.getAttribute("page");
      if(value) {
        url.searchParams.set("page", value);
      } else {
        url.searchParams.delete("page");
      }
      window.location.href = url.href;
    })
  })
}
// End pagination

// button-share
const listButtonShare = document.querySelectorAll("[button-share]");
if(listButtonShare.length > 0) {
  listButtonShare.forEach(button => {
    button.href = button.href + window.location.href;
    // button.href = button.href + "https://28tech.com.vn/lap-trinh-backend-nodejs-middle";
  })
}
// End button-share

// filter-product-status
const listFilterProductStatus = document.querySelectorAll("[filter-product-status]");
if(listFilterProductStatus.length > 0) {
  const url = new URL(window.location.href);
  
  listFilterProductStatus.forEach(input => {
    const name = input.value;
    
    input.addEventListener("change", () => {
      const value = input.checked;
      if(value) {
        url.searchParams.set(name, value);
      } else {
        url.searchParams.delete(name);
      }
      window.location.href = url.href;
    })

    // Hiển thị giá trị mặc định
    const valueCurrent = url.searchParams.get(name);
    if(valueCurrent) {
      input.checked = true;
    }
  })
}
// End filter-product-status

// button-slug
const listButtonSlug = document.querySelectorAll("[button-slug]");
if(listButtonSlug.length > 0) {
  const url = new URL(window.location.href);
  
  listButtonSlug.forEach(button => {
    button.addEventListener("click", () => {
      const slug = button.getAttribute("button-slug");
      if(slug) {
        url.pathname = `/product/category/${slug}`;
        window.location.href = url.href;
      }
    })
  })
}
// End button-slug

// filter-attribute
const listFilterAttribute = document.querySelectorAll("[filter-attribute]");
if(listFilterAttribute.length > 0) {
  const url = new URL(window.location.href);

  listFilterAttribute.forEach(filterAttribute => {
    const id = filterAttribute.getAttribute("filter-attribute");
    const listInput = filterAttribute.querySelectorAll(`input[type="checkbox"]`);
    
    listInput.forEach(input => {
      input.addEventListener("change", () => {
        const listInputChecked = filterAttribute.querySelectorAll(`input[type="checkbox"]:checked`);
        const listValue = [];
        listInputChecked.forEach(inputChecked => listValue.push(inputChecked.value));
        if(listValue.length > 0) {
          url.searchParams.set(`attribute_${id}`, listValue.join(","));
        } else {
          url.searchParams.delete(`attribute_${id}`);
        }
        window.location.href = url.href;
      })
    })

    // Hiển thị giá trị mặc định
    const listValueCurrent = url.searchParams.get(`attribute_${id}`);
    if(listValueCurrent) {
      const listValue = listValueCurrent.split(",");
      listInput.forEach(input => {
        if(listValue.includes(input.value)) {
          input.checked = true;
        }
      })
    }
  })
}
// End filter-attribute

// form-search
const formSearch = document.querySelector("[form-search]");
if(formSearch) {
  const url = new URL(window.location.href);

  // Hiển thị giá trị mặc định
  const categoryCurrent = url.pathname.split("/").pop();
  const keywordCurrent = url.searchParams.get("keyword");
  
  if(categoryCurrent && categoryCurrent != "category") {
    formSearch.category.value = categoryCurrent;
  }

  if(keywordCurrent) {
    formSearch.keyword.value = keywordCurrent;
  }
  
  formSearch.addEventListener("submit", (event) => {
    event.preventDefault();
    const category = event.target.category.value;
    const keyword = event.target.keyword.value;
    
    if(category) {
      url.pathname = `/product/category/${category}`;
    } else {
      url.pathname = `/product/category`;
    }

    if(keyword) {
      url.searchParams.set("keyword", keyword);
    } else {
      url.searchParams.delete("keyword");
    }

    window.location.href = url.href;
  })

  // button-voice
  const buttonVoice = document.querySelector("[button-voice]");
  if(buttonVoice) {
    buttonVoice.addEventListener("click", () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const voice = new SpeechRecognition();
      voice.lang = "vi-VN";
      voice.start();
      voice.onresult = (event) => {
        const value = event.results[0][0].transcript;
        if(value) {
          formSearch.keyword.value = value;
          formSearch.submit();
        }
      };
    })
  }
  // End button-voice

  // Suggest
  const input = formSearch.querySelector(`input[name="keyword"]`);
  const boxSuggest = formSearch.querySelector(`.inner-suggest`);
  const boxSuggestList = boxSuggest.querySelector(`.inner-list`);
  let timeout;

  input.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const keyword = input.value;
      if(keyword) {
        requestJson(`/product/suggest?keyword=${encodeURIComponent(keyword)}`)
          .then(data => {
            if(data.code == "success") {
              const htmlArray = data.list.map(item => {
                return `
                  <a class="inner-item" href="/product/detail/${item.slug}">
                    <img class="inner-image" src="${domainPublic}${item.images[0]}">
                    <div class="inner-info">
                      <div class="inner-name">${item.name}</div>
                      <div class="inner-prices">
                        <div class="inner-price-new">
                          ${item.priceNew.toLocaleString("vi-VN")}đ
                        </div>
                        <div class="inner-price-old">
                          ${item.priceOld.toLocaleString("vi-VN")}đ
                        </div>
                      </div>
                    </div>
                  </a>
                `;
              })
              boxSuggestList.innerHTML = htmlArray.join("");
              if(data.list.length > 0) {
                boxSuggest.style.display = "block";
              } else {
                boxSuggest.style.display = "none";
              }
            }
          })
          // Gợi ý chỉ là phụ: lỗi thì ẩn đi, người dùng vẫn bấm tìm kiếm bình thường
          .catch(() => {
            boxSuggest.style.display = "none";
          })
      } else {
        boxSuggest.style.display = "none";
      }
    }, 500);
  })
  // End Suggest
}
// End form-search

// Tạo giỏ hàng mới
const existCart = localStorage.getItem("cart");
if(!existCart) {
  localStorage.setItem("cart", JSON.stringify([]));
}
// Hết Tạo giỏ hàng mới

// mini-cart-quantity
const miniCartQuantity = () => {
  const cart = JSON.parse(localStorage.getItem("cart"));
  const listElementMiniCartQuantity = document.querySelectorAll("[mini-cart-quantity]");
  listElementMiniCartQuantity.forEach(item => {
    item.innerHTML = cart.length;
  });
}
miniCartQuantity();
// End mini-cart-quantity

// Xóa item trong giỏ hàng
const eventRemoveItemInCart = () => {
  const listButtonRemoveItem = document.querySelectorAll("[button-remove-item]");
  listButtonRemoveItem.forEach(button => {
    button.addEventListener("click", () => {
      const item = button.closest("[cart-item]");
      const productId = item.getAttribute("product-id");
      let variant = item.getAttribute("variant");
      if(variant) {
        variant = JSON.parse(decodeURIComponent(variant));
      }
      
      let cart = JSON.parse(localStorage.getItem("cart"));
      cart = cart.filter(cartItem => {
        // So sánh giống productId
        const sameProduct = cartItem.productId == productId;

        // So sánh giống variant
        const variantItemInCart = cartItem.variant ? JSON.stringify(cartItem.variant) : "[]";
        const variantItemRemove = variant ? JSON.stringify(variant) : "[]";
        const sameVariant = variantItemInCart == variantItemRemove;

        return !(sameProduct && sameVariant);
      });
      
      localStorage.setItem("cart", JSON.stringify(cart));
      drawCart();
      miniCartQuantity();
    })
  })
}
// Hết Xóa item trong giỏ hàng

// Check item trong giỏ hàng
const eventCheckItemInCart = () => {
  const listInputCheckItem = document.querySelectorAll("[cart-table] .cart_page_checkbox input");
  listInputCheckItem.forEach(input => {
    input.addEventListener("change", () => {
      const checked = input.checked;
      const item = input.closest("[cart-item]");
      const productId = item.getAttribute("product-id");
      let variant = item.getAttribute("variant");
      if(variant) {
        variant = JSON.parse(decodeURIComponent(variant));
      }
      
      const cart = JSON.parse(localStorage.getItem("cart"));
      const itemUpdate = cart.find(cartItem => {
        // So sánh giống productId
        const sameProduct = cartItem.productId == productId;

        // So sánh giống variant
        const variantItemInCart = cartItem.variant ? JSON.stringify(cartItem.variant) : "[]";
        const variantItemRemove = variant ? JSON.stringify(variant) : "[]";
        const sameVariant = variantItemInCart == variantItemRemove;

        return (sameProduct && sameVariant);
      })

      itemUpdate.checked = checked;
      localStorage.setItem("cart", JSON.stringify(cart));
      drawCart();
    })
  })
}
// Hết Check item trong giỏ hàng

// Cập nhật số lượng item trong giỏ hàng
const eventQuantityItemInCart = () => {
  const listBoxQuantity = document.querySelectorAll("[cart-table] .cart_page_quantity");
  listBoxQuantity.forEach(box => {
    const inputQuantity = box.querySelector("input");
    const buttonPlus = box.querySelector(".plus");
    const buttonMinus = box.querySelector(".minus");

    const item = box.closest("[cart-item]");
    const productId = item.getAttribute("product-id");
    let variant = item.getAttribute("variant");
    if(variant) {
      variant = JSON.parse(decodeURIComponent(variant));
    }

    const cart = JSON.parse(localStorage.getItem("cart"));
    const itemUpdate = cart.find(cartItem => {
      // So sánh giống productId
      const sameProduct = cartItem.productId == productId;

      // So sánh giống variant
      const variantItemInCart = cartItem.variant ? JSON.stringify(cartItem.variant) : "[]";
      const variantItemRemove = variant ? JSON.stringify(variant) : "[]";
      const sameVariant = variantItemInCart == variantItemRemove;

      return (sameProduct && sameVariant);
    })

    if(itemUpdate) {
      // Nếu số lượng không đủ in ra thông báo
      const quantity = parseInt(inputQuantity.value);
      const max = parseInt(inputQuantity.max);
      if(quantity > max) {
        const itemAlert = document.createElement("div");
        itemAlert.style.color = "red";
        itemAlert.style.fontSize = "12px";
        itemAlert.innerHTML = `Chỉ còn ${max} sản phẩm!`;
        box.appendChild(itemAlert);
      }
      
      // Tăng số lượng
      buttonPlus.addEventListener("click", () => {
        const quantity = parseInt(inputQuantity.value);
        const max = parseInt(inputQuantity.max);
        if(quantity < max) {
          itemUpdate.quantity = quantity + 1;
          localStorage.setItem("cart", JSON.stringify(cart));
          drawCart();
        }
      })

      // Giảm số lượng
      buttonMinus.addEventListener("click", () => {
        const quantity = parseInt(inputQuantity.value);
        const min = parseInt(inputQuantity.min);
        if(quantity > min) {
          itemUpdate.quantity = quantity - 1;
          localStorage.setItem("cart", JSON.stringify(cart));
          drawCart();
        }
      })
    }
  })
}
// Hết Cập nhật số lượng item trong giỏ hàng

// Lấy thông tin địa chỉ đã chọn
const getUserAddress = () => {
  let userAddress = null;
  const inputUserAddressChecked = document.querySelector(`input[name="userAddress"]:checked`);
  if(inputUserAddressChecked) {
    const dataInfo = inputUserAddressChecked.getAttribute("data-info");
    if(dataInfo) {
      userAddress = JSON.parse(dataInfo);
    } else {
      const inputLongitude = document.querySelector(`input[name="longitude"]`);
      const inputLatitude = document.querySelector(`input[name="latitude"]`);
      const longitude = inputLongitude.value;
      const latitude = inputLatitude.value;
      if(longitude && latitude) {
        userAddress = {
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude)
        };
      }
    }
  }
  return userAddress;
}
// Hết Lấy thông tin địa chỉ đã chọn

// Lựa chọn hãng vận chuyển
const eventCheckShipping = () => {
  const listInput = document.querySelectorAll(`[shipping-list] input[name="shippingMethod"]`);
  listInput.forEach(input => {
    input.addEventListener("change", () => {
      drawCart();
    })
  })
}
// Hết Lựa chọn hãng vận chuyển

// Vẽ giỏ hàng khi trống (hoặc dữ liệu giỏ hàng hỏng)
const drawEmptyCart = () => {
  const ulMiniCart = miniCart.querySelector(".offcanvas-body ul");
  ulMiniCart.innerHTML = "Giỏ hàng trống.";

  const cartTable = document.querySelector("[cart-table]");
  if(cartTable) {
    cartTable.closest("table").classList.remove("is-updating");
    cartTable.innerHTML = htmlTableRow(htmlEmpty(`Giỏ hàng trống. <a href="/product/category">Tiếp tục mua sắm</a>`), 7);
  }

  const cartSummary = document.querySelector("[cart-summary]");
  if(cartSummary) {
    cartSummary.classList.remove("is-updating");
    cartSummary.innerHTML = "";
  }

  const elementShippingList = document.querySelector("[shipping-list]");
  if(elementShippingList) {
    elementShippingList.innerHTML = "";
  }

  document.querySelectorAll("[sub-total], [discount], [point-discount], [total]").forEach(item => {
    item.innerHTML = 0;
  })

  // Giỏ trống thì không có gì để đặt
  const buttonOrder = document.querySelector("[button-order]");
  if(buttonOrder) {
    buttonOrder.disabled = true;
  }
}

// Mỗi lần vẽ có một mã: bấm +/- liên tục thì chỉ hiển thị kết quả của lần gọi mới nhất
let drawCartRequestId = 0;

// Vẽ giỏ hàng
const drawCart = () => {
  const cart = JSON.parse(localStorage.getItem("cart"));
  const userAddress = getUserAddress();

  if(cart.length > 0) {
    const requestId = ++drawCartRequestId;
    const cartTable = document.querySelector("[cart-table]");
    const cartSummary = document.querySelector("[cart-summary]");
    const elementShippingList = document.querySelector("[shipping-list]");
    const buttonOrder = document.querySelector("[button-order]");

    // Nhớ hãng vận chuyển đang chọn trước khi khung này chuyển sang trạng thái loading
    const inputShippingChecked = document.querySelector(`[shipping-list] [name="shippingMethod"]:checked`);
    const idInputChecked = inputShippingChecked ? inputShippingChecked.id : null;

    // Loading: lần đầu hiện vòng xoay, các lần sau giữ dữ liệu cũ và làm mờ
    if(cartTable) {
      if(cartTable.querySelector("[cart-item]")) {
        cartTable.closest("table").classList.add("is-updating");
      } else {
        cartTable.innerHTML = htmlTableRow(htmlLoading("Đang tải giỏ hàng..."), 7);
      }
    }
    if(cartSummary) {
      if(cartSummary.querySelector("li:not(.state-row)")) {
        cartSummary.classList.add("is-updating");
      } else {
        cartSummary.innerHTML = `<li class="state-row">${htmlLoading("Đang tải sản phẩm...")}</li>`;
      }
    }
    if(elementShippingList && userAddress) {
      elementShippingList.innerHTML = htmlLoading("Đang tải đơn vị vận chuyển...");
    }
    // Chờ giỏ hàng và phí ship cập nhật xong mới cho đặt hàng
    if(buttonOrder && !isButtonLoading(buttonOrder)) {
      buttonOrder.disabled = true;
    }

    requestJson(`/cart/list`, jsonOptions("POST", {
      cart: cart,
      userAddress: userAddress
    }))
      .then(data => {
        if(requestId != drawCartRequestId) return;

        if(data.code == "error") {
          // Dữ liệu giỏ hàng trong trình duyệt bị hỏng (sản phẩm không hợp lệ): làm trống để người dùng chọn lại
          localStorage.setItem("cart", JSON.stringify([]));
          miniCartQuantity();
          drawEmptyCart();
          notyf.error("Giỏ hàng có sản phẩm không còn hợp lệ, vui lòng thêm lại sản phẩm!");
        }

        if(data.code == "success") {
          localStorage.setItem("cart", JSON.stringify(data.cart));

          let subTotal = 0;
          let shippingFee = 0;

          let htmlMiniCart = "";
          let htmlCartTable = "";
          let htmlCartSummary = "";
          let htmlShipping = "";

          // Hiển thị sản phẩm
          data.cart.forEach(item => {
            const { detail } = item;
            let priceOld = 0;
            let priceNew = 0;
            let stock = 0;
            let htmlVariant = "";
            let htmlVariantSummary = "";

            if(item.variant) {
              // Tìm đúng biến thể khớp trong danh sách
              const variantMatched = detail.variants.find(variantItem => {
                return (
                  variantItem.attributeValue.every(attr => {
                    const selected = item.variant.find(v => v.attrId === attr.attrId);
                    return selected && selected.value === attr.value;
                  })
                );
              });
              priceOld = variantMatched.priceOld;
              priceNew = variantMatched.priceNew;
              stock = variantMatched.stock;

              detail.attributeList.forEach(attr => {
                const variant = item.variant.find(v => v.attrId === attr._id);
                htmlVariant += `
                  <span>
                    <b>${attr.name}:</b> ${variant.label}
                  </span>
                `;

                htmlVariantSummary += `
                  <p>${attr.name}: ${variant.label}</p>
                `;
              })
            } else {
              priceOld = detail.priceOld;
              priceNew = detail.priceNew;
              stock = detail.stock;
            }

            if(item.checked) {
              subTotal += priceNew * item.quantity;
            }

            htmlMiniCart += `
              <li
                cart-item
                product-id=${item.productId}
                ${item.variant ? `variant="${encodeURIComponent(JSON.stringify(item.variant))}"` : ''}
              >
                <a class="cart_img" href="/product/detail/${detail.slug}">
                  <img class="img-fluid w-100" alt="${detail.name}" src="${domainPublic}${detail.images[0]}">
                </a>
                <div class="cart_text">
                  <a class="cart_title" href="/product/detail/${detail.slug}">
                    ${detail.name}
                  </a>
                  <p>
                    ${priceNew.toLocaleString("vi-VN")}đ
                    <del>${priceOld.toLocaleString("vi-VN")}đ</del>
                  </p>
                  <span>
                    <b>Số lượng:</b> ${item.quantity}
                  </span>
                  ${htmlVariant}
                </div>
                <a class="del_icon" href="javascript:;" button-remove-item>
                  <i class="fal fa-times" aria-hidden="true"></i>
                </a>
              </li>
            `;

            htmlCartTable += `
              <tr
                cart-item
                product-id=${item.productId}
                ${item.variant ? `variant="${encodeURIComponent(JSON.stringify(item.variant))}"` : ''}
              >
                <td class="cart_page_checkbox">
                  <div class="form-check">
                    <input class="form-check-input" value="" type="checkbox" ${item.checked && "checked"} />
                  </div>
                </td>
                <td class="cart_page_img">
                  <div class="img">
                    <img class="img-fluid w-100" alt="${detail.name}" src="${domainPublic}${detail.images[0]}" />
                  </div>
                </td>
                <td class="cart_page_details">
                  <a class="title" href="/product/detail/${detail.slug}">${detail.name}</a>
                  <p>
                    ${priceNew.toLocaleString("vi-VN")}đ
                    <del>${priceOld.toLocaleString("vi-VN")}đ</del>
                  </p>
                  ${htmlVariant}
                </td>
                <td class="cart_page_price">
                  <h3>${priceNew.toLocaleString("vi-VN")}đ</h3>
                </td>
                <td class="cart_page_quantity">
                  <div class="details_qty_input">
                    <button class="minus">
                      <i class="fal fa-minus" aria-hidden="true"></i>
                    </button>
                    <input 
                      value="${item.quantity}" 
                      type="number" 
                      readonly="" 
                      min="1"
                      max="${stock}"
                    />
                    <button class="plus">
                      <i class="fal fa-plus" aria-hidden="true"></i>
                    </button>
                  </div>
                </td>
                <td class="cart_page_total">
                  <h3>${(priceNew * item.quantity).toLocaleString("vi-VN")}đ</h3>
                </td>
                <td class="cart_page_action">
                  <a href="javascript:;" button-remove-item>
                    <i class="fal fa-times" aria-hidden="true"></i> Xóa
                  </a>
                </td>
              </tr>
            `;

            if(item.checked) {
              htmlCartSummary += `
                <li>
                  <a class="img" href="/product/detail/${detail.slug}">
                    <img class="img-fluid w-100" alt="${detail.name}" src="${domainPublic}${detail.images[0]}">
                  </a>
                  <div class="text">
                    <a class="title" href="/product/detail/${detail.slug}">
                      ${detail.name}
                    </a>
                    <p>${priceNew.toLocaleString("vi-VN")}đ × ${item.quantity}</p>
                    ${htmlVariantSummary}
                  </div>
                </li>
              `;
            }
          })

          // Hiển thị hãng vận chuyển
          if(data.shippingError) {
            htmlShipping = htmlError(data.shippingError);
          } else if(data.shippingOptions && data.shippingOptions.length == 0) {
            htmlShipping = htmlEmpty("Chưa có đơn vị vận chuyển hỗ trợ địa chỉ này.");
          } else if(!data.shippingOptions && document.querySelector(".checkout_page")) {
            htmlShipping = htmlEmpty("Chọn địa chỉ giao hàng để xem phí vận chuyển.");
          } else if(!data.shippingOptions) {
            htmlShipping = htmlEmpty("Phí vận chuyển được tính ở bước đặt hàng.");
          }

          if(data.shippingOptions) {
            data.shippingOptions.forEach((item, index) => {
              const checked = idInputChecked == `shippingMethod${index}` ? "checked" : "";

              htmlShipping += `
                <div class="form-check">
                  <input 
                    ${checked}
                    class="form-check-input" 
                    id="shippingMethod${index}" 
                    name="shippingMethod" 
                    type="radio"
                    value="${item.id}"
                  >
                  <label class="form-check-label" for="shippingMethod${index}">
                    <small>${item.carrier_name} (${item.service} - ${item.expected}):</small>
                    <span>
                      <span>(+) </span>
                      <span>${item.total_fee.toLocaleString("vi-VN")}đ</span>
                    </span>
                  </label>
                </div>
              `;

              if(checked == "checked") {
                shippingFee = item.total_fee;
              }
            });
          }

          let discount = 0;
          let couponDetail = sessionStorage.getItem("couponDetail");
          if(couponDetail) {
            couponDetail = JSON.parse(couponDetail);

            // Kiểm tra giá trị đơn hàng tối thiểu
            if (subTotal >= couponDetail.minOrderValue) {
              if (couponDetail.typeDiscount === "percentage") {
                discount = (subTotal * couponDetail.value) / 100;

                // Giới hạn mức giảm tối đa (nếu có)
                if (couponDetail.maxDiscountValue > 0 && discount > couponDetail.maxDiscountValue) {
                  discount = couponDetail.maxDiscountValue;
                }

              } else if (couponDetail.typeDiscount === "fixed") {
                discount = couponDetail.value;
              }

              const elementViewCoupon = document.querySelector("#applyCouponForm .inner-view-coupon");
              if(elementViewCoupon) {
                const elementCoupon = elementViewCoupon.querySelector(".inner-coupon");
                elementViewCoupon.style.display = "flex";
                elementCoupon.innerHTML = couponDetail.code;
              }
            } else {
              // Nếu chưa đủ điều kiện áp dụng mã
              notyf.error(`Đơn hàng chưa đạt giá trị tối thiểu: ${couponDetail.minOrderValue}đ`);
              sessionStorage.removeItem("couponDetail");
            }
          }

          let pointDiscount = 0;
          if(data.point && data.point.canUsePoint) {
            // Điểm dùng không vượt quá số tiền còn phải trả (khớp với cách tính ở server)
            const amountBeforePoint = Math.max(0, subTotal + shippingFee - discount);
            const usedPoint = Math.min(data.point.canUsePoint, Math.floor(amountBeforePoint / data.point.POINT_TO_MONEY));
            pointDiscount = usedPoint * data.point.POINT_TO_MONEY;
          }

          let total = Math.max(0, subTotal + shippingFee - discount - pointDiscount);

          const ulMiniCart = miniCart.querySelector(".offcanvas-body ul");
          ulMiniCart.innerHTML = htmlMiniCart;

          if(data.cart.length == 0) {
            // Toàn bộ sản phẩm trong giỏ đã ngừng bán
            drawEmptyCart();
            miniCartQuantity();
            return;
          }

          if(cartTable) {
            cartTable.closest("table").classList.remove("is-updating");
            cartTable.innerHTML = htmlCartTable;
          }

          if(cartSummary) {
            cartSummary.classList.remove("is-updating");
            cartSummary.innerHTML = htmlCartSummary;
          }

          const listElementSubTotal = document.querySelectorAll("[sub-total]");
          listElementSubTotal.forEach(item => {
            item.innerHTML = subTotal.toLocaleString("vi-VN");
          })

          const elementDiscount = document.querySelector("[discount]");
          if(elementDiscount) {
            elementDiscount.innerHTML = discount.toLocaleString("vi-VN");
          }

          const elementPointDiscount = document.querySelector("[point-discount]");
          if(elementPointDiscount) {
            elementPointDiscount.innerHTML = pointDiscount.toLocaleString("vi-VN");
          }

          const elementTotal = document.querySelector("[total]");
          if(elementTotal) {
            elementTotal.innerHTML = total.toLocaleString("vi-VN");
          }

          if(elementShippingList) {
            elementShippingList.innerHTML = htmlShipping;
            bindRetry(elementShippingList, drawCart);
          }

          if(buttonOrder && !isButtonLoading(buttonOrder)) {
            buttonOrder.disabled = false;
          }

          eventRemoveItemInCart();
          eventQuantityItemInCart();
          eventCheckItemInCart();
          eventCheckShipping();
        }
      })
      .catch(error => {
        if(requestId != drawCartRequestId) return;

        // Giữ nguyên giỏ hàng trong trình duyệt, chỉ báo lỗi kèm nút thử lại
        if(cartTable) {
          cartTable.closest("table").classList.remove("is-updating");
          cartTable.innerHTML = htmlTableRow(htmlError(error.message), 7);
          bindRetry(cartTable, drawCart);
        }
        if(cartSummary) {
          cartSummary.classList.remove("is-updating");
          cartSummary.innerHTML = `<li class="state-row">${htmlError(error.message)}</li>`;
          bindRetry(cartSummary, drawCart);
        }
        if(elementShippingList) {
          elementShippingList.innerHTML = "";
        }
      });
  } else {
    drawEmptyCart();
  }
}
// Hết Vẽ giỏ hàng

// Tạo mảng so sánh mới
const existCompareList = localStorage.getItem("compare");
if(!existCompareList) {
  localStorage.setItem("compare", JSON.stringify([]));
}
// Hết Tạo mảng so sánh mới

// mini-compare-quantity
const miniCompareQuantity = () => {
  const compareList = JSON.parse(localStorage.getItem("compare"));
  const miniCompareQuantity = document.querySelector("[mini-compare-quantity]");
  miniCompareQuantity.innerHTML = compareList.length;
}
miniCompareQuantity();
// End mini-compare-quantity

// Tạo mảng yêu thích mới
const existWishlist = localStorage.getItem("wishlist");
if(!existWishlist) {
  localStorage.setItem("wishlist", JSON.stringify([]));
}
// Hết Tạo mảng yêu thích mới

// mini-wishlist-quantity
const miniWishlistQuantity = () => {
  const wishlist = JSON.parse(localStorage.getItem("wishlist"));
  const miniWishlistQuantity = document.querySelector("[mini-wishlist-quantity]");
  miniWishlistQuantity.innerHTML = wishlist.length;
}
miniWishlistQuantity();
// End mini-wishlist-quantity

// shop_details_text
const shopDetailsText = document.querySelector(".shop_details_text");
if(shopDetailsText) {
  const elementStock = shopDetailsText.querySelector(".stock");
  const elementPriceNew = shopDetailsText.querySelector(".price-new");
  const elementPriceOld = shopDetailsText.querySelector(".price-old");
  const listElementLiVariant = shopDetailsText.querySelectorAll(".details_single_variant li");
  const inputQuantity = shopDetailsText.querySelector(".input-quantity");
  const buttonPlus = shopDetailsText.querySelector(".plus");
  const buttonMinus = shopDetailsText.querySelector(".minus");
  const buttonAddCart = shopDetailsText.querySelector("[button-add-cart]");

  const selected = {};
  let variantSelected = null; // biến thể đã chọn

  listElementLiVariant.forEach(item => {
    item.addEventListener("click", () => {
      const attributeId = item.getAttribute("attribute-id");
      const variant = item.getAttribute("variant");

      // Xóa class active cho item cũ
      item.closest("ul").querySelectorAll("li").forEach(li => li.classList.remove("active"));

      // Thêm class active cho thẻ li đã chọn
      item.classList.add("active");
      
      // Lưu lựa chọn
      selected[attributeId] = variant;

      // Kiểm tra xem đã chọn đủ thuộc tính chưa
      const selectedValues = Object.values(selected);
      if(selectedValues.length > 0) {
        // Lọc variant có đủ attributeValue trùng khớp
        const variantMatched = productVariants.find(variantItem => {
          return variantItem.attributeValue.every(attr => selected[attr.attrId] == attr.value)
        })

        if(variantMatched) {
          elementPriceNew.innerHTML = variantMatched.priceNew.toLocaleString("vi-VN") + "đ";
          elementPriceOld.innerHTML = variantMatched.priceOld.toLocaleString("vi-VN") + "đ";

          if(variantMatched.stock > 0) {
            elementStock.innerHTML = `Còn hàng (${variantMatched.stock})`;
            elementStock.classList.remove("out_stock");
            inputQuantity.value = 1;
            variantSelected = variantMatched;
          } else {
            elementStock.innerHTML = `Hết hàng`;
            elementStock.classList.add("out_stock");
            inputQuantity.value = 0;
            variantSelected = null;
          }

          // Gán lại số lượng tối đa được phép đặt
          inputQuantity.max = variantMatched.stock;
        }
      }
    })
  })

  // Tăng số lượng
  buttonPlus.addEventListener("click", () => {
    const quantity = parseInt(inputQuantity.value);
    const max = parseInt(inputQuantity.max);
    if(quantity < max) {
      inputQuantity.value = quantity + 1;
    }
  })

  // Giảm số lượng
  buttonMinus.addEventListener("click", () => {
    const quantity = parseInt(inputQuantity.value);
    const min = parseInt(inputQuantity.min);
    if(quantity > min) {
      inputQuantity.value = quantity - 1;
    }
  })

  // Thêm vào giỏ hàng
  buttonAddCart.addEventListener("click", () => {
    const productId = buttonAddCart.getAttribute("product-id");
    const quantity = parseInt(inputQuantity.value);
    if(productId && quantity > 0) {
      const dataItem = {
        productId: productId,
        quantity: quantity,
        checked: true
      };
      const cart = JSON.parse(localStorage.getItem("cart"));

      if(productVariants && productVariants.length > 0 && variantSelected) {
        dataItem.variant = variantSelected.attributeValue;

        // Tìm xem có sản phẩm trùng productId và trùng các attributeValue hay không
        const existItem = cart.find(item => {
          if(item.productId !== dataItem.productId) {
            return false;
          }

          // So sánh toàn bộ các thuộc tính trong variant
          const oldAttrs = item.variant;
          const newAttrs = dataItem.variant;

          // Số lượng thuộc tính phải trùng
          if(oldAttrs.length !== newAttrs.length) {
            return false;
          }

          // Kiểm tra từng attrId và value
          return oldAttrs.every(attr => {
            const match = newAttrs.find(a => a.attrId === attr.attrId && a.value === attr.value);
            return match ? true : false;
          });
        })

        if(existItem) {
          existItem.quantity = dataItem.quantity;
          notyf.success("Đã cập nhật số lượng trong giỏ hàng!");
        } else {
          cart.unshift(dataItem);
          notyf.success("Đã thêm vào giỏ hàng!");
        }
      } else {
        // Tìm xem có sản phẩm trùng productId hay không
        const existItem = cart.find(item => item.productId === dataItem.productId);

        if(existItem) {
          existItem.quantity = dataItem.quantity;
          notyf.success("Đã cập nhật số lượng trong giỏ hàng!");
        } else {
          cart.unshift(dataItem);
          notyf.success("Đã thêm vào giỏ hàng!");
        }
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      miniCartQuantity();
      drawCart();
    }
  })

  // Mua ngay: thêm vào giỏ rồi chuyển sang trang giỏ hàng
  const buttonBuyNow = shopDetailsText.querySelector("[button-buy-now]");
  buttonBuyNow.addEventListener("click", () => {
    if(parseInt(inputQuantity.value) > 0) {
      buttonAddCart.click();
      window.location.href = "/cart";
    }
  })

  // Hỏi đáp: mở khung chat
  const buttonOpenChat = shopDetailsText.querySelector("[button-open-chat]");
  const chatButton = document.querySelector("#chat-button");
  const chatPopup = document.querySelector("#chat-popup");
  if(chatButton && chatPopup) {
    buttonOpenChat.addEventListener("click", () => {
      if(chatPopup.classList.contains("hidden")) {
        chatButton.click();
      }
    })
  }

  // Thêm vào so sánh
  const buttonAddCompare = shopDetailsText.querySelector("[button-add-compare]");
  buttonAddCompare.addEventListener("click", () => {
    const productId = buttonAddCompare.getAttribute("product-id");
    if(productId) {
      const dataItem = {
        productId: productId
      };
      const compareList = JSON.parse(localStorage.getItem("compare"));

      if(compareList.length < 5) {
        if(productVariants && productVariants.length > 0 && variantSelected) {
          dataItem.variant = variantSelected.attributeValue;

          // Tìm xem có sản phẩm trùng productId và trùng các attributeValue hay không
          const existItem = compareList.find(item => {
            if(item.productId !== dataItem.productId) {
              return false;
            }

            // So sánh toàn bộ các thuộc tính trong variant
            const oldAttrs = item.variant;
            const newAttrs = dataItem.variant;

            // Số lượng thuộc tính phải trùng
            if(oldAttrs.length !== newAttrs.length) {
              return false;
            }

            // Kiểm tra từng attrId và value
            return oldAttrs.every(attr => {
              const match = newAttrs.find(a => a.attrId === attr.attrId && a.value === attr.value);
              return match ? true : false;
            });
          })

          if(existItem) {
            notyf.success("Sản phẩm đã có trong so sánh!");
          } else {
            compareList.push(dataItem);
            notyf.success("Đã thêm vào so sánh!");
          }
        } else {
          // Tìm xem có sản phẩm trùng productId hay không
          const existItem = compareList.find(item => item.productId === dataItem.productId);

          if(existItem) {
            notyf.success("Sản phẩm đã có trong so sánh!");
          } else {
            compareList.push(dataItem);
            notyf.success("Đã thêm vào so sánh!");
          }
        }

        localStorage.setItem("compare", JSON.stringify(compareList));
        miniCompareQuantity();
      } else {
        notyf.error("Số lượng sản phẩm so sánh đã đủ!");
      }
    }
  })

  // Thêm vào yêu thích
  const buttonAddWishlist = shopDetailsText.querySelector("[button-add-wishlist]");
  buttonAddWishlist.addEventListener("click", () => {
    const productId = buttonAddWishlist.getAttribute("product-id");
    const quantity = parseInt(inputQuantity.value);
    if(productId && quantity > 0) {
      const dataItem = {
        productId: productId,
        quantity: quantity
      };
      const wishlist = JSON.parse(localStorage.getItem("wishlist"));

      if(productVariants && productVariants.length > 0 && variantSelected) {
        dataItem.variant = variantSelected.attributeValue;

        // Tìm xem có sản phẩm trùng productId và trùng các attributeValue hay không
        const existItem = wishlist.find(item => {
          if(item.productId !== dataItem.productId) {
            return false;
          }

          // So sánh toàn bộ các thuộc tính trong variant
          const oldAttrs = item.variant;
          const newAttrs = dataItem.variant;

          // Số lượng thuộc tính phải trùng
          if(oldAttrs.length !== newAttrs.length) {
            return false;
          }

          // Kiểm tra từng attrId và value
          return oldAttrs.every(attr => {
            const match = newAttrs.find(a => a.attrId === attr.attrId && a.value === attr.value);
            return match ? true : false;
          });
        })

        if(existItem) {
          notyf.success("Sản phẩm đã có trong yêu thích!");
        } else {
          wishlist.unshift(dataItem);
          notyf.success("Đã thêm vào yêu thích!");
        }
      } else {
        // Tìm xem có sản phẩm trùng productId hay không
        const existItem = wishlist.find(item => item.productId === dataItem.productId);

        if(existItem) {
          notyf.success("Sản phẩm đã có trong yêu thích!");
        } else {
          wishlist.unshift(dataItem);
          notyf.success("Đã thêm vào yêu thích!");
        }
      }

      localStorage.setItem("wishlist", JSON.stringify(wishlist));
      miniWishlistQuantity();
    }
  })
}
// End shop_details_text

// Giỏ hàng
const miniCart = document.querySelector("[mini-cart]");
if(miniCart) {
  drawCart();
}
// Hết Giỏ hàng

// Input Check All
const inputCartCheckAll = document.querySelector("[input-cart-check-all]");
if(inputCartCheckAll) {
  inputCartCheckAll.addEventListener("change", () => {
    const checked = inputCartCheckAll.checked;
    const cart = JSON.parse(localStorage.getItem("cart"));
    cart.forEach(item => item.checked = checked);
    localStorage.setItem("cart", JSON.stringify(cart));
    drawCart();
  })
}
// End Input Check All

// Nút thêm vào giỏ hàng ở trang So sánh
const eventAddItemToCartInCompare = () => {
  const listButtonAdd = document.querySelectorAll("[button-add]");
  listButtonAdd.forEach(button => {
    button.addEventListener("click", () => {
      const index = button.getAttribute("button-add");
      const compareList = JSON.parse(localStorage.getItem("compare"));
      const compareItem = compareList[index];
      const dataItem = {
        productId: compareItem.productId,
        quantity: 1,
        checked: true
      };

      const cart = JSON.parse(localStorage.getItem("cart"));

      if(compareItem.variant) {
        dataItem.variant = compareItem.variant;

        // Tìm xem có sản phẩm trùng productId và trùng các attributeValue hay không
        const existItem = cart.find(item => {
          if(item.productId !== dataItem.productId) {
            return false;
          }

          // So sánh toàn bộ các thuộc tính trong variant
          const oldAttrs = item.variant;
          const newAttrs = dataItem.variant;

          // Số lượng thuộc tính phải trùng
          if(oldAttrs.length !== newAttrs.length) {
            return false;
          }

          // Kiểm tra từng attrId và value
          return oldAttrs.every(attr => {
            const match = newAttrs.find(a => a.attrId === attr.attrId && a.value === attr.value);
            return match ? true : false;
          });
        })

        if(existItem) {
          notyf.success("Sản phẩm đã có trong giỏ hàng!");
        } else {
          cart.unshift(dataItem);
          notyf.success("Đã thêm vào giỏ hàng!");
        }
      } else {
        // Tìm xem có sản phẩm trùng productId hay không
        const existItem = cart.find(item => item.productId === dataItem.productId);

        if(existItem) {
          notyf.success("Sản phẩm đã có trong giỏ hàng!");
        } else {
          cart.unshift(dataItem);
          notyf.success("Đã thêm vào giỏ hàng!");
        }
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      miniCartQuantity();
      drawCart();
    })
  })
}
// Hết Nút thêm vào giỏ hàng ở trang So sánh

// Nút xóa item khỏi trang so sánh
const eventRemoveItemInCompare = () => {
  const listButtonRemove = document.querySelectorAll("[button-remove]");
  listButtonRemove.forEach(button => {
    button.addEventListener("click", () => {
      const index = parseInt(button.getAttribute("button-remove"));
      const compareList = JSON.parse(localStorage.getItem("compare"));
      compareList.splice(index, 1);
      localStorage.setItem("compare", JSON.stringify(compareList));
      drawNotify("success", "Đã xóa sản phẩm khỏi so sánh!");
      window.location.reload();
    })
  })
}
// Hết Nút xóa item khỏi trang so sánh

// Vẽ Vẽ trang so sánh
const drawComparePage = () => {
  const compareList = JSON.parse(localStorage.getItem("compare"));
  const compareState = document.querySelector("[compare-state]");
  const compareTable = document.querySelector(".compare_list_area .table-responsive");

  // Chưa có sản phẩm: ẩn bảng trống, hiện hướng dẫn
  const showEmptyCompare = () => {
    compareTable.style.display = "none";
    compareState.innerHTML = htmlEmpty(`Chưa có sản phẩm nào để so sánh. <a href="/product/category">Xem sản phẩm</a>`);
  }

  if(compareList.length > 0) {
    compareTable.style.display = "none";
    compareState.innerHTML = htmlLoading("Đang tải sản phẩm so sánh...");

    requestJson(`/compare/list`, jsonOptions("POST", compareList))
      .then(data => {
        if(data.code == "error") {
          localStorage.setItem("compare", JSON.stringify([]));
          miniCompareQuantity();
          showEmptyCompare();
        }

        if(data.code == "success") {
          localStorage.setItem("compare", JSON.stringify(data.compareList));
          if(data.compareList.length == 0) {
            showEmptyCompare();
            return;
          }
          compareState.innerHTML = "";
          compareTable.style.display = "";

          let html1 = "";
          let html2 = "";
          let html3 = "";
          let html4 = "";
          let html5 = "";
          let html6 = "";

          data.compareList.forEach((item, index) => {
            const { detail } = item;
            let priceOld = 0;
            let priceNew = 0;
            let stock = 0;
            let htmlVariant = "";

            if(item.variant) {
              // Tìm đúng biến thể khớp trong danh sách
              const variantMatched = detail.variants.find(variantItem => {
                return (
                  variantItem.attributeValue.every(attr => {
                    const selected = item.variant.find(v => v.attrId === attr.attrId);
                    return selected && selected.value === attr.value;
                  })
                );
              });
              priceOld = variantMatched.priceOld;
              priceNew = variantMatched.priceNew;
              stock = variantMatched.stock;

              detail.attributeList.forEach(attr => {
                const variant = item.variant.find(v => v.attrId === attr._id);
                htmlVariant += `
                  <p>${attr.name}: ${variant.label}</p>
                `;
              })
            } else {
              priceOld = detail.priceOld;
              priceNew = detail.priceNew;
              stock = detail.stock;
            }

            html1 += `
              <td>
                <img class="img-fluid w-100" alt="${detail.name}" src="${domainPublic}${detail.images[0]}">
                <a class="title" href="/product/detail/${detail.slug}">${detail.name}</a>
              </td>
            `;

            html2 += `
              <td>
                ${detail.description}
              </td>
            `;

            html3 += `
              <td>
                <p>
                  ${priceNew.toLocaleString("vi-VN")}đ
                  <del>${priceOld.toLocaleString("vi-VN")}đ</del>
                </p>
              </td>
            `;

            html4 += `
              <td>
                ${htmlVariant}
              </td>
            `;

            html5 += `
              <td>
                <p class="rating">
                  <i class="fas fa-star" aria-hidden="true"></i>
                  <i class="fas fa-star" aria-hidden="true"></i>
                  <i class="fas fa-star" aria-hidden="true"></i>
                  <i class="fas fa-star" aria-hidden="true"></i>
                  <i class="fas fa-star" aria-hidden="true"></i>
                  <i class="fal fa-star" aria-hidden="true"></i>
                </p>
              </td>
            `;

            html6 += `
              <td>
                ${
                  stock > 0 ? 
                  '<a class="common_btn" href="javascript:;" button-add="'+index+'">Thêm vào giỏ</a>' 
                  : 
                  '<div class="text-danger">Đã hết hàng</div>'
                }
                <a class="remove common_btn" href="javascript:;" button-remove="${index}">
                  <i class="fal fa-trash" aria-hidden="true"></i>
                </a>
              </td>
            `;
          })

          const elementHtml1 = document.querySelector("[html-1]");
          elementHtml1.outerHTML = html1;

          const elementHtml2 = document.querySelector("[html-2]");
          elementHtml2.outerHTML = html2;

          const elementHtml3 = document.querySelector("[html-3]");
          elementHtml3.outerHTML = html3;

          const elementHtml4 = document.querySelector("[html-4]");
          elementHtml4.outerHTML = html4;

          const elementHtml5 = document.querySelector("[html-5]");
          elementHtml5.outerHTML = html5;

          const elementHtml6 = document.querySelector("[html-6]");
          elementHtml6.outerHTML = html6;

          eventAddItemToCartInCompare();
          eventRemoveItemInCompare();
        }
      })
      .catch(error => {
        compareState.innerHTML = htmlError(error.message);
        bindRetry(compareState, drawComparePage);
      });
  } else {
    showEmptyCompare();
  }
}
// Hết Vẽ trang so sánh

// Trang so sánh
const comparePage = document.querySelector(".compare_page");
if(comparePage) {
  drawComparePage();
}
// Hết Trang so sánh

// Cập nhật số lượng item trong yêu thích
const eventQuantityItemInWishlist = () => {
  const listBoxQuantity = document.querySelectorAll("[wishlist-table] .cart_page_quantity");
  listBoxQuantity.forEach(box => {
    const inputQuantity = box.querySelector("input");
    const buttonPlus = box.querySelector(".plus");
    const buttonMinus = box.querySelector(".minus");

    const item = box.closest("[cart-item]");
    const productId = item.getAttribute("product-id");
    let variant = item.getAttribute("variant");
    if(variant) {
      variant = JSON.parse(decodeURIComponent(variant));
    }

    const wishlist = JSON.parse(localStorage.getItem("wishlist"));
    const itemUpdate = wishlist.find(wishItem => {
      // So sánh giống productId
      const sameProduct = wishItem.productId == productId;

      // So sánh giống variant
      const variantItemInCart = wishItem.variant ? JSON.stringify(wishItem.variant) : "[]";
      const variantItemRemove = variant ? JSON.stringify(variant) : "[]";
      const sameVariant = variantItemInCart == variantItemRemove;

      return (sameProduct && sameVariant);
    })

    if(itemUpdate) {
      // Nếu số lượng không đủ in ra thông báo
      const quantity = parseInt(inputQuantity.value);
      const max = parseInt(inputQuantity.max);
      if(quantity > max) {
        const itemAlert = document.createElement("div");
        itemAlert.style.color = "red";
        itemAlert.style.fontSize = "12px";
        itemAlert.innerHTML = `Chỉ còn ${max} sản phẩm!`;
        box.appendChild(itemAlert);
      }
      
      // Tăng số lượng
      buttonPlus.addEventListener("click", () => {
        const quantity = parseInt(inputQuantity.value);
        const max = parseInt(inputQuantity.max);
        if(quantity < max) {
          itemUpdate.quantity = quantity + 1;
          localStorage.setItem("wishlist", JSON.stringify(wishlist));
          drawWishlistPage();
        } else {
          notyf.error(`Chỉ còn ${max} sản phẩm.`);
        }
      })

      // Giảm số lượng
      buttonMinus.addEventListener("click", () => {
        const quantity = parseInt(inputQuantity.value);
        const min = parseInt(inputQuantity.min);
        if(quantity > min) {
          itemUpdate.quantity = quantity - 1;
          localStorage.setItem("wishlist", JSON.stringify(wishlist));
          drawWishlistPage();
        }
      })
    }
  })
}
// Hết Cập nhật số lượng item trong yêu thích

// Nút thêm vào giỏ hàng ở trang Yêu thích
const eventAddItemToCartInWishlist = () => {
  const listButtonAdd = document.querySelectorAll("[button-add]");
  listButtonAdd.forEach(button => {
    button.addEventListener("click", () => {
      const index = button.getAttribute("button-add");
      const wishlist = JSON.parse(localStorage.getItem("wishlist"));
      const wishItem = wishlist[index];
      const dataItem = {
        productId: wishItem.productId,
        quantity: wishItem.quantity,
        checked: true
      };

      const cart = JSON.parse(localStorage.getItem("cart"));

      if(wishItem.variant) {
        dataItem.variant = wishItem.variant;

        // Tìm xem có sản phẩm trùng productId và trùng các attributeValue hay không
        const existItem = cart.find(item => {
          if(item.productId !== dataItem.productId) {
            return false;
          }

          // So sánh toàn bộ các thuộc tính trong variant
          const oldAttrs = item.variant;
          const newAttrs = dataItem.variant;

          // Số lượng thuộc tính phải trùng
          if(oldAttrs.length !== newAttrs.length) {
            return false;
          }

          // Kiểm tra từng attrId và value
          return oldAttrs.every(attr => {
            const match = newAttrs.find(a => a.attrId === attr.attrId && a.value === attr.value);
            return match ? true : false;
          });
        })

        if(existItem) {
          existItem.quantity = dataItem.quantity;
          notyf.success("Sản phẩm đã có trong giỏ hàng!");
        } else {
          cart.unshift(dataItem);
          notyf.success("Đã thêm vào giỏ hàng!");
        }
      } else {
        // Tìm xem có sản phẩm trùng productId hay không
        const existItem = cart.find(item => item.productId === dataItem.productId);

        if(existItem) {
          existItem.quantity = dataItem.quantity;
          notyf.success("Sản phẩm đã có trong giỏ hàng!");
        } else {
          cart.unshift(dataItem);
          notyf.success("Đã thêm vào giỏ hàng!");
        }
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      miniCartQuantity();
      drawCart();
    })
  })
}
// Hết Nút thêm vào giỏ hàng ở trang Yêu thích

// Nút xóa item khỏi trang yêu thích
const eventRemoveItemInWishlist = () => {
  const listButtonRemove = document.querySelectorAll("[button-remove]");
  listButtonRemove.forEach(button => {
    button.addEventListener("click", () => {
      const index = parseInt(button.getAttribute("button-remove"));
      const wishlist = JSON.parse(localStorage.getItem("wishlist"));
      wishlist.splice(index, 1);
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
      drawNotify("success", "Đã xóa sản phẩm khỏi danh sách yêu thích!");
      window.location.reload();
    })
  })
}
// Hết Nút xóa item khỏi trang yêu thích

// Vẽ danh sách yêu thích
const drawWishlistPage = () => {
  const wishlist = JSON.parse(localStorage.getItem("wishlist"));
  const wishlistTable = document.querySelector("[wishlist-table]");
  const htmlEmptyWishlist = htmlTableRow(htmlEmpty(`Chưa có sản phẩm yêu thích. <a href="/product/category">Xem sản phẩm</a>`), 6);

  if(wishlist.length > 0) {
    // Lần đầu hiện vòng xoay, khi đổi số lượng thì giữ bảng cũ và làm mờ
    if(wishlistTable.querySelector("[cart-item]")) {
      wishlistTable.closest("table").classList.add("is-updating");
    } else {
      wishlistTable.innerHTML = htmlTableRow(htmlLoading("Đang tải danh sách yêu thích..."), 6);
    }

    requestJson(`/wishlist/list`, jsonOptions("POST", wishlist))
      .then(data => {
        wishlistTable.closest("table").classList.remove("is-updating");

        if(data.code == "error") {
          localStorage.setItem("wishlist", JSON.stringify([]));
          miniWishlistQuantity();
          wishlistTable.innerHTML = htmlEmptyWishlist;
        }

        if(data.code == "success") {
          localStorage.setItem("wishlist", JSON.stringify(data.wishlist));
          if(data.wishlist.length == 0) {
            wishlistTable.innerHTML = htmlEmptyWishlist;
            return;
          }
          
          let htmlWishlistTable = "";

          data.wishlist.forEach((item, index) => {
            const { detail } = item;
            let priceOld = 0;
            let priceNew = 0;
            let stock = 0;
            let htmlVariant = "";

            if(item.variant) {
              // Tìm đúng biến thể khớp trong danh sách
              const variantMatched = detail.variants.find(variantItem => {
                return (
                  variantItem.attributeValue.every(attr => {
                    const selected = item.variant.find(v => v.attrId === attr.attrId);
                    return selected && selected.value === attr.value;
                  })
                );
              });
              priceOld = variantMatched.priceOld;
              priceNew = variantMatched.priceNew;
              stock = variantMatched.stock;
              
              detail.attributeList.forEach(attr => {
                const variant = item.variant.find(v => v.attrId === attr._id);
                htmlVariant += `
                  <span>
                    <b>${attr.name}:</b> ${variant.label}
                  </span>
                `;
              })
            } else {
              priceOld = detail.priceOld;
              priceNew = detail.priceNew;
              stock = detail.stock;
            }

            htmlWishlistTable += `
              <tr
                cart-item 
                product-id="${item.productId}" 
                ${item.variant ? `variant="${encodeURIComponent(JSON.stringify(item.variant))}"` : ''}
              >
                <td class="cart_page_img">
                  <div class="img">
                    <img class="img-fluid w-100" alt="${detail.name}" src="${domainPublic}${detail.images[0]}">
                  </div>
                </td>
                <td class="cart_page_details">
                  <a class="title" href="/product/detail/${detail.slug}">${detail.name}</a>
                  <p>
                    ${priceNew.toLocaleString("vi-VN")}đ
                    <del>${priceOld.toLocaleString("vi-VN")}đ</del>
                  </p>
                  ${htmlVariant}
                </td>
                <td class="cart_page_price">
                  <h3>${priceNew.toLocaleString("vi-VN")}đ</h3>
                </td>
                <td class="cart_page_quantity">
                  <div class="details_qty_input">
                    <button class="minus">
                      <i class="fal fa-minus" aria-hidden="true"></i>
                    </button>
                    <input 
                      value="${item.quantity}" 
                      type="number" 
                      readonly="" 
                      min="1" 
                      max="${stock}" 
                    />
                    <button class="plus">
                      <i class="fal fa-plus" aria-hidden="true"></i>
                    </button>
                  </div>
                </td>
                <td class="cart_page_price">
                  <h3>${(item.quantity*priceNew).toLocaleString("vi-VN")}đ</h3>
                </td>
                <td class="cart_page_action">
                  ${
                    stock > 0 ? 
                    '<a class="common_btn" href="javascript:;" button-add="'+index+'">Thêm vào giỏ</a>' 
                    : 
                    '<div class="text-danger">Đã hết hàng</div>'
                  }
                  <a class="remove common_btn" href="javascript:;" button-remove="${index}">Xóa</a>
                </td>
              </tr>
            `;
          })

          wishlistTable.innerHTML = htmlWishlistTable;

          eventQuantityItemInWishlist();
          eventAddItemToCartInWishlist();
          eventRemoveItemInWishlist();
        }
      })
      .catch(error => {
        wishlistTable.closest("table").classList.remove("is-updating");
        wishlistTable.innerHTML = htmlTableRow(htmlError(error.message), 6);
        bindRetry(wishlistTable, drawWishlistPage);
      });
  } else {
    wishlistTable.innerHTML = htmlEmptyWishlist;
  }
}
// Hết Vẽ danh sách yêu thích

// Trang yêu thích
const wishlistPage = document.querySelector(".wishlist_page");
if(wishlistPage) {
  drawWishlistPage();
}
// Hết Trang yêu thích

// Register Form
const registerForm = document.querySelector("#registerForm");
if(registerForm) {
  const validation = new JustValidate('#registerForm');

  validation
    .addField('#fullName', [
      {
        rule: 'required',
        errorMessage: 'Vui lòng nhập họ tên!'
      },
      {
        rule: 'minLength',
        value: 5,
        errorMessage: 'Họ tên phải có ít nhất 5 ký tự!',
      },
      {
        rule: 'maxLength',
        value: 50,
        errorMessage: 'Họ tên không được vượt quá 50 ký tự!',
      },
    ])
    .addField('#email', [
      {
        rule: 'required',
        errorMessage: 'Vui lòng nhập email của bạn!',
      },
      {
        rule: 'email',
        errorMessage: 'Email không đúng định dạng!',
      },
    ])
    .addField('#phone', [
      {
        rule: 'required',
        errorMessage: 'Vui lòng nhập số điện thoại!'
      },
      {
        rule: 'customRegexp',
        value: /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/,
        errorMessage: "Số điện thoại không đúng định dạng!"
      },
    ])
    .addField('#password', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập mật khẩu!"
      },
      {
        rule: 'minLength',
        value: 8,
        errorMessage: "Mật khẩu phải có ít nhất 8 ký tự!"
      },
      {
        rule: 'customRegexp',
        value: /[A-Z]/,
        errorMessage: "Mật khẩu phải có ít nhất một chữ cái viết hoa!"
      },
      {
        rule: 'customRegexp',
        value: /[a-z]/,
        errorMessage: "Mật khẩu phải có ít nhất một chữ cái viết thường!"
      },
      {
        rule: 'customRegexp',
        value: /\d/,
        errorMessage: "Mật khẩu phải có ít nhất một chữ số!"
      },
      {
        rule: 'customRegexp',
        value: /[~!@#$%^&*]/,
        errorMessage: "Mật khẩu phải có ít nhất một ký tự đặc biệt! (~!@#$%^&*)"
      },
    ])
    .addField('#confirmPassword', [
      {
        rule: 'required',
        errorMessage: 'Vui lòng xác nhận mật khẩu!',
      },
      {
        validator: (value, fields) => {
          const password = fields['#password'].elem.value;
          return value == password;
        },
        errorMessage: 'Mật khẩu xác nhận không khớp!',
      }
    ])
    .onSuccess((event) => {
      const fullName = event.target.fullName.value;
      const email = event.target.email.value;
      const phone = event.target.phone.value;
      const password = event.target.password.value;

      const dataFinal = {
        fullName: fullName,
        email: email,
        phone: phone,
        password: password,
      };

      sendWithButton(getSubmitButton(event.target), `/auth/register`, jsonOptions("POST", dataFinal), data => {
        if(data.code == "error") {
          notyf.error(data.message);
        }

        if(data.code == "success") {
          drawNotify(data.code, data.message);
          window.location.href = `/`;
          return true;
        }
      }, "Đang tạo tài khoản...");
    })
  ;
}
// End Register Form

// Login Form
const loginForm = document.querySelector("#loginForm");
if(loginForm) {
  const validation = new JustValidate('#loginForm');

  validation
    .addField('#email', [
      {
        rule: 'required',
        errorMessage: 'Vui lòng nhập email của bạn!',
      },
      {
        rule: 'email',
        errorMessage: 'Email không đúng định dạng!',
      },
    ])
    .addField('#password', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập mật khẩu!"
      },
    ])
    .onSuccess((event) => {
      const email = event.target.email.value;
      const password = event.target.password.value;
      const rememberPassword = event.target.rememberPassword.checked;

      const dataFinal = {
        email: email,
        password: password,
        rememberPassword: rememberPassword
      };

      sendWithButton(getSubmitButton(event.target), `/auth/login`, jsonOptions("POST", dataFinal), data => {
        if(data.code == "error") {
          notyf.error(data.message);
        }

        if(data.code == "success") {
          drawNotify(data.code, data.message);
          window.location.href = `/`;
          return true;
        }
      }, "Đang đăng nhập...");
    })
  ;
}
// End Login Form

// Forgot Password Form
const forgotPasswordForm = document.querySelector("#forgotPasswordForm");
if(forgotPasswordForm) {
  const validation = new JustValidate('#forgotPasswordForm');

  validation
    .addField('#email', [
      {
        rule: 'required',
        errorMessage: 'Vui lòng nhập email của bạn!',
      },
      {
        rule: 'email',
        errorMessage: 'Email không đúng định dạng!',
      },
    ])
    .onSuccess((event) => {
      const email = event.target.email.value;

      const dataFinal = {
        email: email
      };

      sendWithButton(getSubmitButton(event.target), `/auth/forgot-password`, jsonOptions("POST", dataFinal), data => {
        if(data.code == "error") {
          notyf.error(data.message);
        }

        if(data.code == "success") {
          drawNotify(data.code, data.message);
          window.location.href = `/auth/otp-password?email=${email}`;
          return true;
        }
      }, "Đang gửi mã OTP...");
    })
  ;
}
// End Forgot Password Form

// OTP Password Form
const otpPasswordForm = document.querySelector("#otpPasswordForm");
if(otpPasswordForm) {
  const validation = new JustValidate('#otpPasswordForm');

  validation
    .addField('#otp', [
      {
        rule: 'required',
        errorMessage: 'Vui lòng nhập mã OTP!',
      },
    ])
    .onSuccess((event) => {
      const email = event.target.email.value;
      const otp = event.target.otp.value;

      const dataFinal = {
        email: email,
        otp: otp
      };

      sendWithButton(getSubmitButton(event.target), `/auth/otp-password`, jsonOptions("POST", dataFinal), data => {
        if(data.code == "error") {
          notyf.error(data.message);
        }

        if(data.code == "success") {
          drawNotify(data.code, data.message);
          window.location.href = `/auth/reset-password`;
          return true;
        }
      }, "Đang xác thực...");
    })
  ;
}
// End OTP Password Form

// Reset Password Form
const resetPasswordForm = document.querySelector("#resetPasswordForm");
if(resetPasswordForm) {
  const validation = new JustValidate('#resetPasswordForm');

  validation
    .addField('#password', [
      {
        rule: 'required',
        errorMessage: "Vui lòng nhập mật khẩu mới!"
      },
      {
        rule: 'minLength',
        value: 8,
        errorMessage: "Mật khẩu phải có ít nhất 8 ký tự!"
      },
      {
        rule: 'customRegexp',
        value: /[A-Z]/,
        errorMessage: "Mật khẩu phải có ít nhất một chữ cái viết hoa!"
      },
      {
        rule: 'customRegexp',
        value: /[a-z]/,
        errorMessage: "Mật khẩu phải có ít nhất một chữ cái viết thường!"
      },
      {
        rule: 'customRegexp',
        value: /\d/,
        errorMessage: "Mật khẩu phải có ít nhất một chữ số!"
      },
      {
        rule: 'customRegexp',
        value: /[~!@#$%^&*]/,
        errorMessage: "Mật khẩu phải có ít nhất một ký tự đặc biệt! (~!@#$%^&*)"
      },
    ])
    .addField('#confirmPassword', [
      {
        rule: 'required',
        errorMessage: 'Vui lòng xác nhận mật khẩu!',
      },
      {
        validator: (value, fields) => {
          const password = fields['#password'].elem.value;
          return value == password;
        },
        errorMessage: 'Mật khẩu xác nhận không khớp!',
      }
    ])
    .onSuccess((event) => {
      const password = event.target.password.value;

      const dataFinal = {
        password: password,
      };

      // Trang đổi mật khẩu trong tài khoản có thêm ô mật khẩu hiện tại
      if(event.target.currentPassword) {
        dataFinal.currentPassword = event.target.currentPassword.value;
      }

      sendWithButton(getSubmitButton(event.target), `/auth/reset-password`, jsonOptions("POST", dataFinal), data => {
        if(data.code == "error") {
          notyf.error(data.message);
        }

        if(data.code == "success") {
          drawNotify(data.code, data.message);
          const dataHrefSuccess = resetPasswordForm.getAttribute("data-href-success");
          window.location.href = dataHrefSuccess ? dataHrefSuccess : `/`;
          return true;
        }
      }, "Đang lưu mật khẩu...");
    })
  ;
}
// End Reset Password Form

// Dashboard Profile Edit Form
const dashboardProfileEditForm = document.querySelector("#dashboardProfileEditForm");
if(dashboardProfileEditForm) {
  const validation = new JustValidate('#dashboardProfileEditForm');

  validation
    .addField('#fullName', [
      {
        rule: 'required',
        errorMessage: 'Vui lòng nhập họ tên!'
      },
      {
        rule: 'minLength',
        value: 5,
        errorMessage: 'Họ tên phải có ít nhất 5 ký tự!',
      },
      {
        rule: 'maxLength',
        value: 50,
        errorMessage: 'Họ tên không được vượt quá 50 ký tự!',
      },
    ])
    .addField('#email', [
      {
        rule: 'required',
        errorMessage: 'Vui lòng nhập email của bạn!',
      },
      {
        rule: 'email',
        errorMessage: 'Email không đúng định dạng!',
      },
    ])
    .addField('#phone', [
      {
        rule: 'customRegexp',
        value: /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/,
        errorMessage: "Số điện thoại không đúng định dạng!"
      },
    ])
    .onSuccess((event) => {
      const fullName = event.target.fullName.value;
      const email = event.target.email.value;
      const phone = event.target.phone.value;

      const dataFinal = {
        fullName: fullName,
        email: email,
        phone: phone,
      };

      sendWithButton(getSubmitButton(event.target), `/dashboard/profile/edit`, jsonOptions("PATCH", dataFinal), data => {
        if(data.code == "error") {
          notyf.error(data.message);
        }

        if(data.code == "success") {
          notyf.success(data.message);
        }
      }, "Đang lưu...");
    })
  ;
}
// End Dashboard Profile Edit Form

// Dashboard Address Create Form
const dashboardAddressCreateForm = document.querySelector("#dashboardAddressCreateForm");
if(dashboardAddressCreateForm) {
  const validation = new JustValidate('#dashboardAddressCreateForm');

  validation
    .addField('#fullName', [
      {
        rule: 'required',
        errorMessage: 'Vui lòng nhập họ tên!'
      },
      {
        rule: 'minLength',
        value: 5,
        errorMessage: 'Họ tên phải có ít nhất 5 ký tự!',
      },
      {
        rule: 'maxLength',
        value: 50,
        errorMessage: 'Họ tên không được vượt quá 50 ký tự!',
      },
    ])
    .addField('#phone', [
      {
        rule: 'required',
        errorMessage: 'Vui lòng nhập số điện thoại!'
      },
      {
        rule: 'customRegexp',
        value: /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/,
        errorMessage: "Số điện thoại không đúng định dạng!"
      },
    ])
    .addField('#address', [
      {
        rule: 'required',
        errorMessage: 'Vui lòng nhập tên đường, tòa nhà, số nhà!',
      },
    ])
    .addField('#longitude', [
      {
        rule: 'required',
        errorMessage: 'Địa chỉ không hợp lệ!',
      },
    ])
    .addField('#latitude', [
      {
        rule: 'required',
        errorMessage: 'Địa chỉ không hợp lệ!',
      },
    ])
    .onSuccess((event) => {
      const fullName = event.target.fullName.value;
      const phone = event.target.phone.value;
      const address = event.target.address.value;
      const longitude = event.target.longitude.value;
      const latitude = event.target.latitude.value;
      const isDefault = event.target.isDefault.checked;

      const dataFinal = {
        fullName: fullName,
        phone: phone,
        address: address,
        longitude: longitude,
        latitude: latitude,
        isDefault: isDefault,
      };

      sendWithButton(getSubmitButton(event.target), `/dashboard/address/create`, jsonOptions("POST", dataFinal), data => {
        if(data.code == "error") {
          notyf.error(data.message);
        }

        if(data.code == "success") {
          drawNotify(data.code, data.message);
          window.location.href = `/dashboard/address`;
          return true;
        }
      }, "Đang lưu địa chỉ...");
    })
  ;
}
// End Dashboard Address Create Form

// button-api
const listButtonApi = document.querySelectorAll("[button-api]");
if(listButtonApi.length > 0) {
  listButtonApi.forEach(button => {
    button.addEventListener("click", () => {
      const method = button.getAttribute("data-method");
      const api = button.getAttribute("data-api");

      // Thao tác không hoàn tác được (vd: xóa) thì hỏi lại trước
      const confirmMessage = button.getAttribute("data-confirm");
      if(confirmMessage && !window.confirm(confirmMessage)) return;

      sendWithButton(button, api, { method: method || "GET" }, data => {
        if(data.code == "error") {
          notyf.error(data.message);
        }

        if(data.code == "success") {
          drawNotify(data.code, data.message);
          location.reload();
          return true;
        }
      });
    })
  })
}
// End button-api

// Map
const boxMap = document.querySelector("#boxMap");
let map = null;
if(boxMap) {
  // Khởi tạo bản đồ
  map = new ol.Map({
    target: 'boxMap',
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM()
      })
    ],
    view: new ol.View({
      center: ol.proj.fromLonLat([105.8163212, 21.0227384]),
      zoom: 13
    })
  });

  // Layer để chứa marker (điểm đánh dấu)
  const markerLayer = new ol.layer.Vector({ source: new ol.source.Vector() });
  map.addLayer(markerLayer);

  // Hàm thêm marker (điểm đánh dấu)
  const setMarker = (lon, lat) => {
    markerLayer.getSource().clear();
    const marker = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat]))
    });
    
    marker.setStyle(new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 1],
        src: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', // icon location
        scale: 0.5 // thu nhỏ lại cho vừa bản đồ
      })
    }));

    markerLayer.getSource().addFeature(marker);
  }

  // Hiển thị vị trí mặc định
  const inputLon = document.querySelector(`[name="longitude"]`);
  const inputLat = document.querySelector(`[name="latitude"]`);
  if(inputLon.value && inputLat.value) {
    const lon = parseFloat(inputLon.value);
    const lat = parseFloat(inputLat.value);
    setMarker(lon, lat);
    // Di chuyển bản đồ đến đúng vị trí
    map.getView().animate({ center: ol.proj.fromLonLat([lon, lat]), zoom: 15 });
  }

  // Cho phép click để chọn vị trí
  map.on('click', (event) => {
    const coord = ol.proj.toLonLat(event.coordinate);
    const lon = coord[0];
    const lat = coord[1];
    setMarker(lon, lat);

    // Trong lúc chờ: báo ngay ở ô địa chỉ
    const inputAddress = document.querySelector(`[name="address"]`);
    const placeholderAddress = inputAddress.placeholder;
    inputAddress.value = "";
    inputAddress.placeholder = "Đang lấy địa chỉ từ bản đồ...";

    // Gọi API Nominatim để lấy địa chỉ chi tiết
    requestJson(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
      .then(data => {
        if(data && data.display_name) {
          inputAddress.value = data.display_name;

          const inputLon = document.querySelector(`[name="longitude"]`);
          inputLon.value = lon;

          const inputLat = document.querySelector(`[name="latitude"]`);
          inputLat.value = lat;

          // Cập nhật lại giỏ hàng
          drawCart();
        } else {
          notyf.error("Không tìm thấy địa chỉ!");
        }
      })
      .catch(error => notyf.error(error.message))
      .finally(() => {
        inputAddress.placeholder = placeholderAddress;
      });
  });

  // Tìm kiếm địa điểm
  const searchInput = document.querySelector("#mapSearchInput");
  const searchBtn = document.querySelector("#mapSearchBtn");
  searchBtn.addEventListener("click", () => {
    const keyword = searchInput.value;
    if(!keyword) {
      notyf.error("Vui lòng nhập địa chỉ tìm kiếm!");
      return;
    }
    
    if(isButtonLoading(searchBtn)) return;
    setButtonLoading(searchBtn, true, "Đang tìm...");

    requestJson(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(keyword)}&countrycodes=vn`)
      .then(data => {
        if(data && data.length > 0) {
          const firstResult = data[0];
          const lon = parseFloat(firstResult.lon);
          const lat = parseFloat(firstResult.lat);
          setMarker(lon, lat);
          // Di chuyển bản đồ đến đúng vị trí
          map.getView().animate({ center: ol.proj.fromLonLat([lon, lat]), zoom: 15 });

          // Gán lại địa chỉ vào ô input
          const inputAddress = document.querySelector(`[name="address"]`);
          inputAddress.value = firstResult.display_name;

          const inputLon = document.querySelector(`[name="longitude"]`);
          inputLon.value = lon;

          const inputLat = document.querySelector(`[name="latitude"]`);
          inputLat.value = lat;

          // Cập nhật lại giỏ hàng (phí vận chuyển theo địa chỉ mới), giống khi bấm chọn trên bản đồ
          drawCart();
        } else {
          notyf.error("Không tìm thấy địa chỉ!");
        }
      })
      .catch(error => notyf.error(error.message))
      .finally(() => setButtonLoading(searchBtn, false));
  })
}
// End Map

// Dashboard Address Edit Form
const dashboardAddressEditForm = document.querySelector("#dashboardAddressEditForm");
if(dashboardAddressEditForm) {
  const validation = new JustValidate('#dashboardAddressEditForm');

  validation
    .addField('#fullName', [
      {
        rule: 'required',
        errorMessage: 'Vui lòng nhập họ tên!'
      },
      {
        rule: 'minLength',
        value: 5,
        errorMessage: 'Họ tên phải có ít nhất 5 ký tự!',
      },
      {
        rule: 'maxLength',
        value: 50,
        errorMessage: 'Họ tên không được vượt quá 50 ký tự!',
      },
    ])
    .addField('#phone', [
      {
        rule: 'required',
        errorMessage: 'Vui lòng nhập số điện thoại!'
      },
      {
        rule: 'customRegexp',
        value: /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/,
        errorMessage: "Số điện thoại không đúng định dạng!"
      },
    ])
    .addField('#address', [
      {
        rule: 'required',
        errorMessage: 'Vui lòng nhập tên đường, tòa nhà, số nhà!',
      },
    ])
    .addField('#longitude', [
      {
        rule: 'required',
        errorMessage: 'Địa chỉ không hợp lệ!',
      },
    ])
    .addField('#latitude', [
      {
        rule: 'required',
        errorMessage: 'Địa chỉ không hợp lệ!',
      },
    ])
    .onSuccess((event) => {
      const id = event.target.id.value;
      const fullName = event.target.fullName.value;
      const phone = event.target.phone.value;
      const address = event.target.address.value;
      const longitude = parseFloat(event.target.longitude.value);
      const latitude = parseFloat(event.target.latitude.value);
      const isDefault = event.target.isDefault.checked;

      const dataFinal = {
        fullName: fullName,
        phone: phone,
        address: address,
        longitude: longitude,
        latitude: latitude,
        isDefault: isDefault,
      };

      sendWithButton(getSubmitButton(event.target), `/dashboard/address/edit/${id}`, jsonOptions("PATCH", dataFinal), data => {
        if(data.code == "error") {
          notyf.error(data.message);
        }

        if(data.code == "success") {
          notyf.success(data.message);
        }
      }, "Đang lưu địa chỉ...");
    })
  ;
}
// End Dashboard Address Edit Form

// Profile Photo
const profilePhoto = document.querySelector("#profile_photo");
if(profilePhoto) {
  profilePhoto.addEventListener("change", (event) => {
    const avatar = event.target.files[0];
    if(avatar) {
      // Tạo FormData
      const formData = new FormData();
      formData.append("avatar", avatar);

      // Đang tải ảnh lên: làm mờ ảnh cũ và khóa ô chọn file
      const profilePhotoPreview = document.querySelector("[profile-photo-preview]");
      profilePhoto.disabled = true;
      profilePhotoPreview.classList.add("is-updating");

      requestJson(`/dashboard/profile/change-avatar`, {
        method: "PATCH",
        body: formData
      })
        .then(data => {
          if(data.code == "error") {
            notyf.error(data.message);
          }

          if(data.code == "success") {
            profilePhotoPreview.src = `${domainPublic}${data.linkAvatar}`;
            notyf.success(data.message);
          }
        })
        .catch(error => notyf.error(error.message))
        .finally(() => {
          profilePhoto.disabled = false;
          profilePhotoPreview.classList.remove("is-updating");
          // Cho phép chọn lại đúng file vừa chọn nếu lần trước lỗi
          profilePhoto.value = "";
        });
    }
  })
}
// End Profile Photo

// Apply Coupon Form
const applyCouponForm = document.querySelector("#applyCouponForm");

function checkCoupon(coupon) {
  const elementViewCoupon = document.querySelector("#applyCouponForm .inner-view-coupon");
  const elementCoupon = elementViewCoupon.querySelector(".inner-coupon");

  const dataFinal = {
    coupon: coupon,
  };

  sendWithButton(getSubmitButton(applyCouponForm), `/coupon/check`, jsonOptions("POST", dataFinal), data => {
    if(data.code == "error") {
      notyf.error(data.message);
      elementViewCoupon.style.display = "none";
      sessionStorage.removeItem("couponDetail");
    }

    if(data.code == "success") {
      notyf.success(data.message);
      elementViewCoupon.style.display = "flex";
      elementCoupon.innerHTML = coupon;
      sessionStorage.setItem("couponDetail", JSON.stringify(data.couponDetail));
    }

    drawCart();
  }, "Đang kiểm tra...");
}

if(applyCouponForm) {
  // Thêm mã giảm giá
  applyCouponForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const coupon = event.target.coupon.value;
    if(!coupon) {
      notyf.error("Vui lòng nhập mã giảm giá!");
      return;
    }
    checkCoupon(coupon);
  })

  // Xóa mã giảm giá
  const buttonRemove = document.querySelector("#applyCouponForm .inner-view-coupon .inner-remove");
  if(buttonRemove) {
    const elementViewCoupon = document.querySelector("#applyCouponForm .inner-view-coupon");
    buttonRemove.addEventListener("click", () => {
      elementViewCoupon.style.display = "none";
      sessionStorage.removeItem("couponDetail");
      drawCart();
    })
  }
}
// End Apply Coupon Form

// Checkout Page
const checkoutPage = document.querySelector(".checkout_page");
if(checkoutPage) {
  const listInputUserAddress = checkoutPage.querySelectorAll(`input[name="userAddress"]`);

  const collapseEl = checkoutPage.querySelector("#collapseThree");
  const collapse = new bootstrap.Collapse(collapseEl, { toggle: false });

  listInputUserAddress.forEach(input => {
    input.addEventListener("change", () => {
      // Bỏ toàn bộ checked
      listInputUserAddress.forEach(i => {
        if(input.value == i.value) {
          i.checked = true;
        } else {
          i.checked = false;
        }
      });
      if(input.value == "") {
        collapse.show();
      } else {
        collapse.hide();
      }
      if(map) {
        map.updateSize();
      }

      // Cập nhật lại giỏ hàng
      drawCart();
    })
  })
}
// End Checkout Page

// Button Order
const buttonOrder = document.querySelector("[button-order]");
if(buttonOrder) {
  buttonOrder.addEventListener("click", () => {
    // Thông tin khách hàng
    const inputUserAddressChecked = document.querySelector(`input[name="userAddress"]:checked`);
    if(!inputUserAddressChecked) {
      notyf.error("Vui lòng nhập địa chỉ!");
      return;
    }
    const dataUser = {};
    if(inputUserAddressChecked.value) {
      const info = JSON.parse(inputUserAddressChecked.getAttribute("data-info"));
      dataUser.fullName = info.fullName;
      dataUser.phone = info.phone;
      dataUser.address = info.address;
      dataUser.longitude = info.longitude;
      dataUser.latitude = info.latitude;
    } else {
      const checkoutAddressForm = document.querySelector("#checkoutAddressForm");
      dataUser.fullName = checkoutAddressForm.fullName.value;
      dataUser.phone = checkoutAddressForm.phone.value;
      dataUser.address = checkoutAddressForm.address.value;
      dataUser.longitude = parseFloat(checkoutAddressForm.longitude.value);
      dataUser.latitude = parseFloat(checkoutAddressForm.latitude.value);
    }
    const textareaNote = document.querySelector(`textarea[name="note"]`);
    dataUser.note = textareaNote.value;

    // Thông tin sản phẩm
    let dataCart = JSON.parse(localStorage.getItem("cart"));
    dataCart = dataCart.filter(item => {
      delete item.detail;
      return item.checked;
    });

    // Mã giảm giá
    let dataCoupon = "";
    let coupon = sessionStorage.getItem("couponDetail");
    if(coupon) {
      coupon = JSON.parse(coupon);
      dataCoupon = coupon.code;
    }

    // Phương thức thanh toán
    const inputPaymentMethodChecked = document.querySelector(`input[name="paymentMethod"]:checked`);
    const dataPaymentMethod = inputPaymentMethodChecked.value;

    // Hãng vận chuyển
    const inputShippingMethodChecked = document.querySelector(`input[name="shippingMethod"]:checked`);
    const dataShippingMethod = inputShippingMethodChecked?.value;
    if(!dataShippingMethod) {
      notyf.error("Vui lòng chọn phương thức vận chuyển!");
      return;
    }

    // Dữ liệu hoàn chỉnh
    const dataFinal = {
      ...dataUser,
      items: dataCart,
      coupon: dataCoupon,
      paymentMethod: dataPaymentMethod,
      shippingMethod: dataShippingMethod
    };

    // Gửi lên backend: khóa nút tới khi có kết quả để không tạo trùng đơn; thành công thì giữ khóa vì sắp chuyển trang
    sendWithButton(buttonOrder, `/order/create`, jsonOptions("POST", dataFinal), data => {
      if(data.code == "error") {
        notyf.error(data.message);
      }

      if(data.code == "success") {
        // Xóa item đã đặt khỏi giỏ hàng
        let cart = JSON.parse(localStorage.getItem("cart"));
        cart = cart.filter(item => item.checked == false);
        localStorage.setItem("cart", JSON.stringify(cart));

        // Xóa mã giảm giá
        sessionStorage.removeItem("couponDetail");

        switch (dataPaymentMethod) {
          case "money":
            // Chuyển sang trang Đặt hàng thành công
            drawNotify(data.code, data.message);
            window.location.href = `/order/success?orderCode=${data.orderCode}&phone=${data.phone}`;
            break;
          case "zalopay":
            // Chuyển sang trang thanh toán bằng ZaloPay
            window.location.href = `/order/payment-zalopay?orderCode=${data.orderCode}&phone=${data.phone}`;
            break;
          case "vnpay":
            // Chuyển sang trang thanh toán bằng VNPay
            window.location.href = `/order/payment-vnpay?orderCode=${data.orderCode}&phone=${data.phone}`;
            break;
          default:
            window.location.href = "/";
            break;
        }
        return true;
      }
    }, "Đang đặt hàng...");
  })
}
// End Button Order

// Viết đánh giá
const listButtonReview = document.querySelectorAll("[data-bs-target='#modalReview']");
if(listButtonReview.length > 0) {
  const modalReview = document.querySelector("#modalReview");
  const formReview = document.querySelector("[form-review]");
  let productName = "";
  let orderItemId = "";
  let variant = "";
  listButtonReview.forEach(button => {
    button.addEventListener("click", () => {
      productName = button.getAttribute("product-name");
      orderItemId = button.getAttribute("order-item-id");
      variant = button.getAttribute("variant");
      variant = variant ? `(${variant})` : "";

      // Cập nhật tiêu đề modal
      const modalTitle = modalReview.querySelector("[product-name]");
      modalTitle.innerHTML = `${productName} ${variant}`;

      // Thêm orderItemId vào form
      formReview.orderItemId.value = orderItemId;

      // Xóa đánh giá cũ
      const listStar = formReview.querySelectorAll(`[rating] i`);
      listStar.forEach(star => star.classList.remove("active"));

      // Xóa bình luận cũ
      formReview.comment.value = "";

      // Xóa ảnh cũ
      const listPreviewImage = formReview.querySelectorAll("[images] .gallery .apnd-img");
      listPreviewImage.forEach(img => img.remove());
      const listInputImage = formReview.querySelectorAll("[images] .gallery input");
      listInputImage.forEach(input => input.remove());
    })
  })

  formReview.addEventListener("submit", (event) => {
    event.preventDefault();
    const orderId = formReview.orderId.value;
    const orderItemId = formReview.orderItemId.value;
    const rating = formReview.querySelectorAll(`[rating] i.active`).length;
    const comment = formReview.comment.value.trim();
    const inputImages = formReview.querySelectorAll("[images] .gallery input");
    const images = [];
    inputImages.forEach(input => {
      if(input.files[0]) {
        images.push(input.files[0]);
      }
    });

    if(!orderId || !orderItemId) {
      notyf.error("Đã có lỗi xảy ra, vui lòng thử lại!");
      return;
    }

    if(rating == 0) {
      notyf.error("Vui lòng chọn số sao đánh giá!");
      return;
    }
    if(comment.length == 0) {
      notyf.error("Vui lòng nhập bình luận đánh giá!");
      return;
    }
    if(comment.length > 300) {
      notyf.error("Bình luận không được vượt quá 300 ký tự!");
      return;
    }

    // Tạo FormData
    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("orderItemId", orderItemId);
    formData.append("rating", rating);
    formData.append("comment", comment);
    images.forEach(image => {
      formData.append(`images`, image);
    });

    sendWithButton(getSubmitButton(formReview), `/dashboard/order/review`, {
      method: "POST",
      body: formData
    }, data => {
      if(data.code == "error") {
        notyf.error(data.message);
      }
      if(data.code == "success") {
        drawNotify(data.code, data.message);
        window.location.reload();
        return true;
      }
    }, "Đang gửi đánh giá...");
  })
}
// Hết Viết đánh giá

// filterRating
const listInputFilterRating = document.querySelectorAll(`.sidebar_rating input[name="rating"]`);
if(listInputFilterRating.length > 0) {
  const url = new URL(window.location.href);

  listInputFilterRating.forEach(input => {
    input.addEventListener("change", () => {
      const listInputChecked = document.querySelectorAll(`.sidebar_rating input[name="rating"]:checked`);
      if(listInputChecked.length > 0) {
        const listValue = [];
        listInputChecked.forEach(input => {
          listValue.push(input.value);
        });
        url.searchParams.set("rating", listValue.join(","));
      } else {
        url.searchParams.delete("rating");
      }
      window.location.href = url.href;
    })
  })

  // Hiển thị lựa chọn mặc định
  const rating = url.searchParams.get("rating");
  if(rating) {
    const listRating = rating.split(",");
    listRating.forEach(item => {
      const input = document.querySelector(`.sidebar_rating input[name="rating"][value="${item}"]`);
      if(input) {
        input.checked = true;
      }
    })
  }
}
// End filterRating


// Khởi tạo tính năng dịch
const gtranslateWrapper = document.querySelector(".gtranslate_wrapper");
if(gtranslateWrapper) {
  window.gtranslateSettings = {
    "default_language":"vi",
    "native_language_names":true,
    "wrapper_selector":".gtranslate_wrapper",
    "flag_size":24,
    "switcher_horizontal_position":"inline"
  }
}
// Hết Khởi tạo tính năng dịch