/**
 * One-off Courses Page - Standalone Course Catalog
 * TODO: Implement CourseTeaser components and course filtering
 */

import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Clock, 
  Users, 
  Star, 
  BookOpen,
  Play,
  Award
} from 'lucide-react';

const OneOffCourses: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // TODO: Replace with actual course data from API
  const courses = [
    {
      id: '1',
      title: 'Úvod do umělé inteligence',
      description: 'Kompletní kurz pro začátečníky o základech AI a strojového učení',
      category: 'AI & ML',
      level: 'Začátečník',
      duration: 120, // minutes
      students: 1250,
      rating: 4.8,
      price: 2990,
      thumbnail: '',
      instructor: 'Dr. Pavel Novák',
    },
    {
      id: '2', 
      title: 'Moderní webové technologie',
      description: 'React, TypeScript a moderní frontend development',
      category: 'Vývoj',
      level: 'Pokročilý',
      duration: 180,
      students: 890,
      rating: 4.9,
      price: 3990,
      thumbnail: '',
      instructor: 'Ing. Jana Svobodová',
    },
    {
      id: '3',
      title: 'Projektové řízení v IT',
      description: 'Agile, Scrum a efektivní vedení technických projektů',
      category: 'Management',
      level: 'Středněpokročilý',
      duration: 90,
      students: 645,
      rating: 4.7,
      price: 1990,
      thumbnail: '',
      instructor: 'Mgr. Tomáš Černý',
    },
  ];

  const categories = ['all', 'AI & ML', 'Vývoj', 'Management', 'Design', 'Marketing'];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-16">
        <div className="container-xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">
              Profesionální{' '}
              <span className="text-gradient-primary">kurzy</span> na míru
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Rozšiřte své dovednosti s našimi expertně vytvořenými kurzy. 
              Každý kurz je navržen pro praktické použití v reálném světě.
            </p>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-12">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Hledat kurzy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? 'gradient-primary text-white' : ''}
                >
                  {category === 'all' ? 'Všechny' : category}
                </Button>
              ))}
            </div>
            
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Další filtry
            </Button>
          </div>
          
          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-soft transition-shadow">
                <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                  <Play className="h-12 w-12 text-muted-foreground" />
                </div>
                
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="secondary">{course.category}</Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Star className="h-4 w-4 mr-1 text-warning fill-current" />
                      {course.rating}
                    </div>
                  </div>
                  
                  <CardTitle className="text-xl leading-tight">
                    {course.title}
                  </CardTitle>
                  
                  <p className="text-muted-foreground text-sm">
                    {course.description}
                  </p>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {Math.floor(course.duration / 60)}h {course.duration % 60}min
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {course.students.toLocaleString()}
                    </div>
                    <Badge variant="outline">{course.level}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {course.price.toLocaleString()} Kč
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {course.instructor}
                      </div>
                    </div>
                    
                    <Button className="gradient-primary text-white">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Koupit kurz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredCourses.length === 0 && (
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Žádné kurzy nenalezeny</h3>
              <p className="text-muted-foreground">
                Zkuste upravit vyhledávací kritéria nebo kategorie
              </p>
            </div>
          )}
          
          {/* CTA Section */}
          <div className="text-center mt-20 p-12 bg-muted/50 rounded-2xl">
            <Award className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">
              Chcete vytvořit vlastní kurz?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              S naší platformou můžete snadno vytvářet, spravovat a prodávat 
              své vlastní vzdělávací kurzy s podporou AI.
            </p>
            <Button size="lg" className="gradient-primary text-white">
              Začít vytvářet
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OneOffCourses;