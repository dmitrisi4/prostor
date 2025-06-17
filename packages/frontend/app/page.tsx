export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Добро пожаловать в Простор</h1>
      <p className="text-lg mb-4">
        Платформа для обмена контентом, создания коллекций и общения с единомышленниками.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <FeatureCard 
          title="Делитесь контентом" 
          description="Загружайте изображения, видео, документы и код. Поддержка различных форматов."
          icon="📤"
        />
        <FeatureCard 
          title="Создавайте коллекции" 
          description="Организуйте контент в тематические коллекции и борды."
          icon="📚"
        />
        <FeatureCard 
          title="Общайтесь" 
          description="Лайкайте, комментируйте и подписывайтесь на интересных авторов."
          icon="👥"
        />
      </div>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}