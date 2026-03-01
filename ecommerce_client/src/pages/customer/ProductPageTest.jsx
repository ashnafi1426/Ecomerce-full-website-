import { useParams } from 'react-router-dom'

const ProductPageTest = () => {
  const { id } = useParams()
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Product Page Test</h1>
      <p>Product ID: {id}</p>
      <p>If you see this, the Router context is working!</p>
    </div>
  )
}

export default ProductPageTest
